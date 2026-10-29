import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirestoreError,
} from 'firebase/firestore';
import { getFirebaseFirestore, isFatalFirestoreError } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { DataContext, type DataContextValue } from '@/lib/dataContext';
import {
  normalizeSettings,
  parseProject,
  parseSession,
  parseTask,
  parseTemplate,
} from '@/db/parse';
import { DEFAULT_SETTINGS } from '@/db/queries/settings';
import { seedDefaultsOnly } from '@/db/seed';
import { useTimerStore } from '@/stores/timerStore';
import { toast } from '@/components/ui/Toast';
import { brandShades } from '@/lib/color';
import type { Project, Session, Task, TimerSettings, TimerTemplate } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * Sessions are read for a date window, not all time. The app starts with a short
 * window (enough for the sidebar's weekly goal) so launching straight into the
 * timer stays fast for long-time users; pages that chart history widen it via
 * ensureSessionsSince (see useSessions).
 */
const INITIAL_WINDOW_DAYS = 35;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const INITIAL_LOADING = {
  projects: true,
  tasks: true,
  templates: true,
  sessions: true,
  settings: true,
};

let reloadOffered = false;

function reportListenerError(source: string, err: FirestoreError) {
  // Firestore is shut down on sign-out (possibly from another tab); listeners
  // still attached at that moment fail harmlessly.
  if (/terminated|shutting down/i.test(err.message)) return;
  console.error(`[data] ${source} listener failed:`, err);
  if (isFatalFirestoreError(err)) {
    if (!reloadOffered) {
      reloadOffered = true;
      toast.error('Local storage stopped responding. Reload to reconnect.', {
        label: 'Reload',
        onClick: () => window.location.reload(),
      });
    }
    return;
  }
  toast.error(
    err.code === 'permission-denied'
      ? 'You no longer have access to this data. Try signing in again.'
      : `Couldn't load your ${source}. Check your connection.`
  );
}

/**
 * One set of Firestore listeners for the whole signed-in app. Previously every
 * page (and the always-mounted sidebar) opened its own listeners, re-reading the
 * user's entire session history on each navigation.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TimerTemplate[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(INITIAL_LOADING);
  const [error, setError] = useState<string | null>(null);
  const [sessionsSince, setSessionsSince] = useState(() =>
    startOfDay(Date.now() - INITIAL_WINDOW_DAYS * DAY_MS)
  );

  const done = useCallback(
    (key: keyof typeof INITIAL_LOADING) => setLoading((l) => (l[key] ? { ...l, [key]: false } : l)),
    []
  );

  const fail = useCallback(
    (key: keyof typeof INITIAL_LOADING, source: string) => (err: FirestoreError) => {
      reportListenerError(source, err);
      setError(err.message);
      done(key);
    },
    [done]
  );

  // Reset everything when the signed-in user changes (including sign-out), so
  // nothing from a previous account can leak into the next one.
  // This runs during render rather than in an effect so it lands before the
  // pages' effects ask for a wider session window, instead of undoing them.
  const [dataUid, setDataUid] = useState(uid);
  if (dataUid !== uid) {
    setDataUid(uid);
    setProjects([]);
    setTasks([]);
    setTemplates([]);
    setSessions([]);
    setSettings(DEFAULT_SETTINGS);
    setError(null);
    setLoading(INITIAL_LOADING);
    setSessionsSince(startOfDay(Date.now() - INITIAL_WINDOW_DAYS * DAY_MS));
  }

  useEffect(() => {
    if (!uid) return;
    const db = getFirebaseFirestore();
    const col = (name: string) => collection(db, 'users', uid, name);
    const unsubs = [
      onSnapshot(
        query(col('projects'), orderBy('created_at', 'desc')),
        (snap) => {
          setProjects(snap.docs.flatMap((d) => parseProject(d.id, d.data()) ?? []));
          done('projects');
        },
        fail('projects', 'projects')
      ),
      onSnapshot(
        query(col('tasks'), orderBy('created_at', 'desc')),
        (snap) => {
          setTasks(snap.docs.flatMap((d) => parseTask(d.id, d.data()) ?? []));
          done('tasks');
        },
        fail('tasks', 'tasks')
      ),
      onSnapshot(
        query(col('templates'), orderBy('created_at', 'asc')),
        (snap) => {
          setTemplates(snap.docs.flatMap((d) => parseTemplate(d.id, d.data()) ?? []));
          done('templates');
        },
        fail('templates', 'templates')
      ),
      onSnapshot(
        doc(db, 'users', uid, 'settings', 'default'),
        (snap) => {
          // A missing settings doc on the server means first-time setup never
          // finished (e.g. the signup page was closed mid-seed). Create defaults.
          if (!snap.exists() && !snap.metadata.fromCache) {
            seedDefaultsOnly(uid).catch((err) =>
              console.error('[data] Default setup failed:', err)
            );
          }
          const next = normalizeSettings(snap.data());
          setSettings(next);
          useTimerStore.getState().setSettings(next);
          done('settings');
        },
        fail('settings', 'settings')
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid, done, fail]);

  // Sessions are bounded by a date window instead of loading every session ever.
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(getFirebaseFirestore(), 'users', uid, 'sessions'),
      where('started_at', '>=', sessionsSince),
      orderBy('started_at', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        setSessions(snap.docs.flatMap((d) => parseSession(d.id, d.data()) ?? []));
        done('sessions');
      },
      fail('sessions', 'sessions')
    );
  }, [uid, sessionsSince, done, fail]);

  // Apply the accent colour from settings.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--color-brand', settings.accent_color);
    const shades = brandShades(settings.accent_color);
    root.setProperty('--brand-solid', shades.solid);
    root.setProperty('--brand-text-light', shades.textOnLight);
    root.setProperty('--brand-text-dark', shades.textOnDark);
  }, [settings.accent_color]);

  const loadOlderSessions = useCallback(() => {
    setLoading((l) => ({ ...l, sessions: true }));
    setSessionsSince((since) => startOfDay(since - 365 * DAY_MS));
  }, []);

  const ensureSessionsSince = useCallback((ms: number) => {
    const target = startOfDay(ms);
    setSessionsSince((since) => {
      if (target >= since) return since;
      setLoading((l) => ({ ...l, sessions: true }));
      return target;
    });
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      projects,
      tasks,
      templates,
      sessions,
      settings,
      loading,
      error,
      sessionsSince,
      loadOlderSessions,
      ensureSessionsSince,
    }),
    [
      projects,
      tasks,
      templates,
      sessions,
      settings,
      loading,
      error,
      sessionsSince,
      loadOlderSessions,
      ensureSessionsSince,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

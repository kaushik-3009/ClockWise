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
import { useTimerStore } from '@/stores/timerStore';
import { toast } from '@/components/ui/Toast';
import type { Project, Session, Task, TimerSettings, TimerTemplate } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Default window: a little over a year covers the heatmap, streaks and all stat periods. */
const INITIAL_WINDOW_DAYS = 400;

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
  useEffect(() => {
    setProjects([]);
    setTasks([]);
    setTemplates([]);
    setSessions([]);
    setSettings(DEFAULT_SETTINGS);
    setError(null);
    setLoading(INITIAL_LOADING);
    setSessionsSince(startOfDay(Date.now() - INITIAL_WINDOW_DAYS * DAY_MS));
  }, [uid]);

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
    document.documentElement.style.setProperty('--color-brand', settings.accent_color);
  }, [settings.accent_color]);

  const loadOlderSessions = useCallback(() => {
    setLoading((l) => ({ ...l, sessions: true }));
    setSessionsSince((since) => startOfDay(since - 365 * DAY_MS));
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
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

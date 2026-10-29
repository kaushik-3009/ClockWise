import { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useData } from '@/hooks/useData';
import { reportFailure } from '@/components/ui/Toast';
import { createSession, updateSession, deleteSession } from '@/db/queries/sessions';
import type { Session } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A little over a year covers the heatmap, streaks and all stat periods. */
export const HISTORY_WINDOW_DAYS = 400;

/**
 * Sessions in the shared window. `windowDays` is how far back the caller needs;
 * the window only ever widens, so most pages ask for the full history window and
 * the always-mounted sidebar asks for just the current week.
 */
export function useSessions(projectId?: string, windowDays = HISTORY_WINDOW_DAYS) {
  const { user } = useAuth();
  const {
    sessions: all,
    loading,
    sessionsSince,
    loadOlderSessions,
    ensureSessionsSince,
  } = useData();
  const uid = user?.uid;

  useEffect(() => {
    ensureSessionsSince(Date.now() - windowDays * DAY_MS);
  }, [ensureSessionsSince, windowDays]);

  const sessions = useMemo(
    () => (projectId ? all.filter((s) => s.project_id === projectId) : all),
    [all, projectId]
  );

  const addSession = useCallback(
    (data: Omit<Session, 'id' | 'user_id'>) => {
      if (!uid) return;
      reportFailure(createSession(uid, data).written, "Couldn't save the session");
    },
    [uid]
  );

  const editSession = useCallback(
    (id: string, changes: Partial<Omit<Session, 'id' | 'user_id'>>) => {
      if (!uid) return;
      reportFailure(updateSession(uid, id, changes), "Couldn't update session");
    },
    [uid]
  );

  const removeSession = useCallback(
    (id: string) => {
      if (!uid) return;
      reportFailure(deleteSession(uid, id), "Couldn't delete session");
    },
    [uid]
  );

  return {
    sessions,
    loading: loading.sessions,
    sessionsSince,
    loadOlderSessions,
    addSession,
    editSession,
    removeSession,
  };
}

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useData } from '@/hooks/useData';
import { reportFailure } from '@/components/ui/Toast';
import { createSession, updateSession, deleteSession } from '@/db/queries/sessions';
import type { Session } from '@/types';

export function useSessions(projectId?: string) {
  const { user } = useAuth();
  const { sessions: all, loading, sessionsSince, loadOlderSessions } = useData();
  const uid = user?.uid;

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

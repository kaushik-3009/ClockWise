import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import {
  getAllSessions,
  getSessionsByProject,
  getSessionsInRange,
  createSession,
  updateSession,
  deleteSession,
} from '@/db/queries/sessions';
import type { Session, PhaseType } from '@/types';

export function useSessions(projectId?: string) {
  const sessions = useLiveQuery(
    () => (projectId ? getSessionsByProject(projectId) : getAllSessions()),
    [projectId]
  );

  const addSession = useCallback(
    async (data: {
      project_id?: string;
      task_id?: string;
      type: PhaseType;
      started_at: number;
      duration_seconds: number;
      phase_number: number;
      completed: boolean;
    }) => {
      return createSession(data);
    },
    []
  );

  const editSession = useCallback(async (id: string, changes: Partial<Omit<Session, 'id'>>) => {
    await updateSession(id, changes);
  }, []);

  const removeSession = useCallback(async (id: string) => {
    await deleteSession(id);
  }, []);

  const getRange = useCallback(async (start: number, end: number) => {
    return getSessionsInRange(start, end);
  }, []);

  return {
    sessions: sessions ?? [],
    addSession,
    editSession,
    removeSession,
    getRange,
  };
}

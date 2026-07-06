import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  getSessionsInRange,
  createSession,
  updateSession,
  deleteSession,
} from '@/db/queries/sessions';
import type { Session, PhaseType } from '@/types';

export function useSessions(projectId?: string) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const base = collection(getFirebaseFirestore(), 'users', user.uid, 'sessions');
    const constraints = projectId
      ? [where('project_id', '==', projectId), orderBy('started_at', 'desc')]
      : [orderBy('started_at', 'desc')];
    const q = query(base, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        setSessions(snapshot.docs.map((d) => ({ ...(d.data() as Session), id: d.id })));
        setLoading(false);
      },
      (error) => {
        console.error('[useSessions] Snapshot error:', error);
      }
    );
  }, [user, projectId]);

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
      if (!user) throw new Error('Not authenticated');
      return createSession(user.uid, data);
    },
    [user]
  );

  const editSession = useCallback(
    async (id: string, changes: Partial<Omit<Session, 'id'>>) => {
      if (!user) throw new Error('Not authenticated');
      await updateSession(user.uid, id, changes);
    },
    [user]
  );

  const removeSession = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteSession(user.uid, id);
    },
    [user]
  );

  const getRange = useCallback(
    async (start: number, end: number) => {
      if (!user) return [];
      return getSessionsInRange(user.uid, start, end);
    },
    [user]
  );

  return {
    sessions,
    loading,
    addSession,
    editSession,
    removeSession,
    getRange,
  };
}

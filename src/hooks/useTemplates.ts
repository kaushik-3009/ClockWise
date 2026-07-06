import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { createTemplate, updateTemplate, deleteTemplate } from '@/db/queries/templates';
import type { TimerTemplate } from '@/types';

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TimerTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(getFirebaseFirestore(), 'users', user.uid, 'templates'),
      orderBy('created_at', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        setTemplates(snapshot.docs.map((d) => ({ ...(d.data() as TimerTemplate), id: d.id })));
        setLoading(false);
      },
      (error) => {
        console.error('[useTemplates] Snapshot error:', error);
      }
    );
  }, [user]);

  const addTemplate = useCallback(
    async (data: Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      return createTemplate(user.uid, data);
    },
    [user]
  );

  const editTemplate = useCallback(
    async (id: string, changes: Partial<Omit<TimerTemplate, 'id' | 'created_at'>>) => {
      if (!user) throw new Error('Not authenticated');
      await updateTemplate(user.uid, id, changes);
    },
    [user]
  );

  const removeTemplate = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteTemplate(user.uid, id);
    },
    [user]
  );

  return {
    templates,
    loading,
    addTemplate,
    editTemplate,
    removeTemplate,
  };
}

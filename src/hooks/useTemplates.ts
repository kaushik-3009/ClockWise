import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { createTemplate, updateTemplate, deleteTemplate } from '@/db/queries/templates';
import { seedDefaultsOnly } from '@/db/seed';
import type { TimerTemplate } from '@/types';

const DEFAULT_TEMPLATE_NAMES = new Set([
  'Classic Pomodoro',
  'Deep Work',
  'Quick Sprint',
  'Study Session',
]);

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TimerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const dedupedForUser = useRef<string | null>(null);

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
        const next = snapshot.docs.map((d) => ({ ...(d.data() as TimerTemplate), id: d.id }));
        setTemplates(next);
        setLoading(false);

        // Self-heal accounts that ended up with duplicate default templates
        // from an older seeding bug — run once per session, only if dupes exist.
        if (dedupedForUser.current !== user.uid) {
          const nameCounts = new Map<string, number>();
          for (const t of next) {
            if (!DEFAULT_TEMPLATE_NAMES.has(t.name)) continue;
            nameCounts.set(t.name, (nameCounts.get(t.name) ?? 0) + 1);
          }
          const hasDupes = Array.from(nameCounts.values()).some((count) => count > 1);
          if (hasDupes) {
            dedupedForUser.current = user.uid;
            seedDefaultsOnly(user.uid).catch((err) =>
              console.error('[useTemplates] Dedup failed:', err)
            );
          } else {
            dedupedForUser.current = user.uid;
          }
        }
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

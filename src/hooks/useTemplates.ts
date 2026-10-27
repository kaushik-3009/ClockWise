import { useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useData } from '@/hooks/useData';
import { reportFailure } from '@/components/ui/Toast';
import { createTemplate, updateTemplate, deleteTemplate } from '@/db/queries/templates';
import type { TimerTemplate } from '@/types';

export function useTemplates() {
  const { user } = useAuth();
  const { templates, loading } = useData();
  const uid = user?.uid;

  const addTemplate = useCallback(
    (data: Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>): TimerTemplate => {
      if (!uid) throw new Error('Not authenticated');
      const { template, written } = createTemplate(uid, data);
      reportFailure(written, `Couldn't save template "${data.name}"`);
      return template;
    },
    [uid]
  );

  const editTemplate = useCallback(
    (id: string, changes: Partial<Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>>) => {
      if (!uid) return;
      reportFailure(updateTemplate(uid, id, changes), "Couldn't update template");
    },
    [uid]
  );

  const removeTemplate = useCallback(
    (id: string) => {
      if (!uid) return;
      reportFailure(deleteTemplate(uid, id), "Couldn't delete template");
    },
    [uid]
  );

  return { templates, loading: loading.templates, addTemplate, editTemplate, removeTemplate };
}

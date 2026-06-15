import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/db/queries/templates';
import type { TimerTemplate } from '@/types';

export function useTemplates() {
  const templates = useLiveQuery(() => getAllTemplates(), []);

  const addTemplate = useCallback(async (data: Omit<TimerTemplate, 'id' | 'created_at'>) => {
    return createTemplate(data);
  }, []);

  const editTemplate = useCallback(
    async (id: string, changes: Partial<Omit<TimerTemplate, 'id' | 'created_at'>>) => {
      await updateTemplate(id, changes);
    },
    []
  );

  const removeTemplate = useCallback(async (id: string) => {
    await deleteTemplate(id);
  }, []);

  return {
    templates: templates ?? [],
    addTemplate,
    editTemplate,
    removeTemplate,
  };
}

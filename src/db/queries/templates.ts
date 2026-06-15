import { db } from '../schema';
import type { TimerTemplate } from '@/types';

export async function getAllTemplates(): Promise<TimerTemplate[]> {
  return db.templates.orderBy('created_at').toArray();
}

export async function createTemplate(
  data: Omit<TimerTemplate, 'id' | 'created_at'>
): Promise<TimerTemplate> {
  const template: TimerTemplate = {
    ...data,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  };
  await db.templates.add(template);
  return template;
}

export async function updateTemplate(
  id: string,
  changes: Partial<Omit<TimerTemplate, 'id' | 'created_at'>>
): Promise<void> {
  await db.templates.update(id, changes);
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id);
}

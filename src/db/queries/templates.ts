import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import type { TimerTemplate } from '@/types';

function templateRef(userId: string, id: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'templates', id);
}

export async function createTemplate(
  userId: string,
  data: Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>
): Promise<TimerTemplate> {
  const template: TimerTemplate = {
    ...data,
    user_id: userId,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  };
  await setDoc(templateRef(userId, template.id), template);
  return template;
}

export async function updateTemplate(
  userId: string,
  id: string,
  changes: Partial<Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>>
): Promise<void> {
  await setDoc(templateRef(userId, id), changes, { merge: true });
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  await deleteDoc(templateRef(userId, id));
}

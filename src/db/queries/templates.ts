import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { toUpdate } from '@/db/clean';
import type { TimerTemplate } from '@/types';

function templateRef(userId: string, id: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'templates', id);
}

export function createTemplate(
  userId: string,
  data: Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>
): { template: TimerTemplate; written: Promise<void> } {
  const template: TimerTemplate = {
    ...data,
    user_id: userId,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  };
  return { template, written: setDoc(templateRef(userId, template.id), template) };
}

export async function updateTemplate(
  userId: string,
  id: string,
  changes: Partial<Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>>
): Promise<void> {
  await updateDoc(templateRef(userId, id), toUpdate(changes));
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  await deleteDoc(templateRef(userId, id));
}

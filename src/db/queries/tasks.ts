import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { stripUndefined, toUpdate } from '@/db/clean';
import type { Task } from '@/types';

function taskRef(userId: string, id: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'tasks', id);
}

export function createTask(
  userId: string,
  data: Omit<Task, 'id' | 'created_at' | 'user_id'>
): { task: Task; written: Promise<void> } {
  const task: Task = stripUndefined({
    ...data,
    user_id: userId,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  });
  return { task, written: setDoc(taskRef(userId, task.id), task) };
}

export async function updateTask(
  userId: string,
  id: string,
  changes: Partial<Omit<Task, 'id' | 'user_id'>>
): Promise<void> {
  await updateDoc(taskRef(userId, id), toUpdate(changes));
}

/** Deletes the task only; sessions logged against it keep their history. */
export async function deleteTask(userId: string, id: string): Promise<void> {
  await deleteDoc(taskRef(userId, id));
}

export async function setTaskCompleted(
  userId: string,
  id: string,
  isCompleted: boolean
): Promise<void> {
  await updateDoc(taskRef(userId, id), { is_completed: isCompleted });
}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import type { Task } from '@/types';

function taskRef(userId: string, id: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'tasks', id);
}

function sessionsRef(userId: string) {
  return collection(getFirebaseFirestore(), 'users', userId, 'sessions');
}

export async function getTaskById(userId: string, id: string): Promise<Task | undefined> {
  const snapshot = await getDoc(taskRef(userId, id));
  if (!snapshot.exists()) return undefined;
  return { ...(snapshot.data() as Task), id: snapshot.id };
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export async function createTask(
  userId: string,
  data: Omit<Task, 'id' | 'created_at' | 'user_id'>
): Promise<Task> {
  const task: Task = stripUndefined({
    ...data,
    user_id: userId,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  }) as Task;
  await setDoc(taskRef(userId, task.id), task);
  return task;
}

export async function updateTask(
  userId: string,
  id: string,
  changes: Partial<Omit<Task, 'id' | 'user_id'>>
): Promise<void> {
  await setDoc(taskRef(userId, id), changes, { merge: true });
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  const batch = writeBatch(getFirebaseFirestore());

  const sessionsSnapshot = await getDocs(query(sessionsRef(userId), where('task_id', '==', id)));
  sessionsSnapshot.docs.forEach((d) => batch.delete(d.ref));

  batch.delete(taskRef(userId, id));
  await batch.commit();
}

export async function toggleTaskCompletion(userId: string, id: string): Promise<void> {
  const task = await getTaskById(userId, id);
  if (task) {
    await setDoc(taskRef(userId, id), { is_completed: !task.is_completed }, { merge: true });
  }
}

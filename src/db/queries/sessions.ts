import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import type { Session } from '@/types';

function sessionsRef(userId: string) {
  return collection(getFirebaseFirestore(), 'users', userId, 'sessions');
}

function sessionRef(userId: string, id: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'sessions', id);
}

export async function getSessionsInRange(
  userId: string,
  start: number,
  end: number
): Promise<Session[]> {
  const q = query(
    sessionsRef(userId),
    where('started_at', '>=', start),
    where('started_at', '<=', end),
    orderBy('started_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ ...(d.data() as Session), id: d.id }));
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

export async function createSession(
  userId: string,
  data: Omit<Session, 'id' | 'user_id'>
): Promise<Session> {
  const session: Session = stripUndefined({
    ...data,
    user_id: userId,
    id: crypto.randomUUID(),
  }) as Session;
  await setDoc(sessionRef(userId, session.id), session);
  return session;
}

export async function updateSession(
  userId: string,
  id: string,
  changes: Partial<Omit<Session, 'id' | 'user_id'>>
): Promise<void> {
  await setDoc(sessionRef(userId, id), changes, { merge: true });
}

export async function deleteSession(userId: string, id: string): Promise<void> {
  await deleteDoc(sessionRef(userId, id));
}

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { stripUndefined, toUpdate } from '@/db/clean';
import { parseSession } from '@/db/parse';
import type { Session } from '@/types';

export function sessionsRef(userId: string) {
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
  return snapshot.docs.flatMap((d) => parseSession(d.id, d.data()) ?? []);
}

export function createSession(
  userId: string,
  data: Omit<Session, 'id' | 'user_id'>,
  /** Pass a deterministic id to make the write idempotent (e.g. from several tabs). */
  id: string = crypto.randomUUID()
): { session: Session; written: Promise<void> } {
  const session: Session = stripUndefined({
    ...data,
    user_id: userId,
    id,
  });
  return { session, written: setDoc(sessionRef(userId, session.id), session) };
}

export async function updateSession(
  userId: string,
  id: string,
  changes: Partial<Omit<Session, 'id' | 'user_id'>>
): Promise<void> {
  await updateDoc(sessionRef(userId, id), toUpdate(changes));
}

export async function deleteSession(userId: string, id: string): Promise<void> {
  await deleteDoc(sessionRef(userId, id));
}

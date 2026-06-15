import { db } from '../schema';
import type { Session } from '@/types';

export async function getAllSessions(): Promise<Session[]> {
  return db.sessions.orderBy('started_at').reverse().toArray();
}

export async function getSessionsByProject(projectId: string): Promise<Session[]> {
  return db.sessions.where('project_id').equals(projectId).reverse().sortBy('started_at');
}

export async function getSessionsByTask(taskId: string): Promise<Session[]> {
  return db.sessions.where('task_id').equals(taskId).reverse().sortBy('started_at');
}

export async function getSessionsInRange(start: number, end: number): Promise<Session[]> {
  return db.sessions.where('started_at').between(start, end, true, true).toArray();
}

export async function createSession(data: Omit<Session, 'id'>): Promise<Session> {
  const session: Session = {
    ...data,
    id: crypto.randomUUID(),
  };
  await db.sessions.add(session);
  return session;
}

export async function updateSession(
  id: string,
  changes: Partial<Omit<Session, 'id'>>
): Promise<void> {
  await db.sessions.update(id, changes);
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

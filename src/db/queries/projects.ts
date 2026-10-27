import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { stripUndefined, toUpdate } from '@/db/clean';
import type { Project } from '@/types';

function projectRef(userId: string, id: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'projects', id);
}

function tasksRef(userId: string) {
  return collection(getFirebaseFirestore(), 'users', userId, 'tasks');
}

/**
 * Builds the project and starts the write. The returned project is usable
 * immediately (the local cache updates synchronously); `written` settles when the
 * server acknowledges, which never happens while offline — so callers should not
 * block UI on it, only attach error handling.
 */
export function createProject(
  userId: string,
  data: Omit<Project, 'id' | 'created_at' | 'status' | 'user_id'>
): { project: Project; written: Promise<void> } {
  const project: Project = stripUndefined({
    ...data,
    user_id: userId,
    id: crypto.randomUUID(),
    status: 'active' as const,
    created_at: Date.now(),
  });
  return { project, written: setDoc(projectRef(userId, project.id), project) };
}

export async function updateProject(
  userId: string,
  id: string,
  changes: Partial<Omit<Project, 'id' | 'user_id'>>
): Promise<void> {
  await updateDoc(projectRef(userId, id), toUpdate(changes));
}

/**
 * Deletes the project and its tasks. Recorded sessions are intentionally kept —
 * deleting a project must not rewrite past focus time or break streaks.
 */
export async function deleteProject(userId: string, id: string): Promise<void> {
  const db = getFirebaseFirestore();
  const tasksSnapshot = await getDocs(query(tasksRef(userId), where('project_id', '==', id)));
  const refs = [...tasksSnapshot.docs.map((d) => d.ref), projectRef(userId, id)];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function archiveProject(userId: string, id: string): Promise<void> {
  await updateDoc(projectRef(userId, id), { status: 'archived' });
}

export async function unarchiveProject(userId: string, id: string): Promise<void> {
  await updateDoc(projectRef(userId, id), { status: 'active' });
}

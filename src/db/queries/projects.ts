import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import type { Project } from '@/types';

function projectRef(userId: string, id: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'projects', id);
}

function tasksRef(userId: string) {
  return collection(getFirebaseFirestore(), 'users', userId, 'tasks');
}

function sessionsRef(userId: string) {
  return collection(getFirebaseFirestore(), 'users', userId, 'sessions');
}

export async function getProjectById(userId: string, id: string): Promise<Project | undefined> {
  const snapshot = await getDoc(projectRef(userId, id));
  if (!snapshot.exists()) return undefined;
  return { ...(snapshot.data() as Project), id: snapshot.id };
}

export async function createProject(
  userId: string,
  data: Omit<Project, 'id' | 'created_at' | 'status' | 'user_id'>
): Promise<Project> {
  const project: Project = {
    ...data,
    user_id: userId,
    id: crypto.randomUUID(),
    status: 'active',
    created_at: Date.now(),
  };
  await setDoc(projectRef(userId, project.id), project);
  return project;
}

export async function updateProject(
  userId: string,
  id: string,
  changes: Partial<Omit<Project, 'id' | 'user_id'>>
): Promise<void> {
  await setDoc(projectRef(userId, id), changes, { merge: true });
}

export async function deleteProject(userId: string, id: string): Promise<void> {
  const batch = writeBatch(getFirebaseFirestore());

  // Cascade: delete associated tasks and sessions
  const tasksSnapshot = await getDocs(query(tasksRef(userId), where('project_id', '==', id)));
  tasksSnapshot.docs.forEach((d) => batch.delete(d.ref));

  const sessionsSnapshot = await getDocs(query(sessionsRef(userId), where('project_id', '==', id)));
  sessionsSnapshot.docs.forEach((d) => batch.delete(d.ref));

  batch.delete(projectRef(userId, id));
  await batch.commit();
}

export async function archiveProject(userId: string, id: string): Promise<void> {
  await setDoc(projectRef(userId, id), { status: 'archived' }, { merge: true });
}

export async function unarchiveProject(userId: string, id: string): Promise<void> {
  await setDoc(projectRef(userId, id), { status: 'active' }, { merge: true });
}

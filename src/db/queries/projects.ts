import { db } from '../schema';
import type { Project } from '@/types';

export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('created_at').reverse().toArray();
}

export async function getActiveProjects(): Promise<Project[]> {
  return db.projects.where('status').equals('active').reverse().sortBy('created_at');
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function createProject(
  data: Omit<Project, 'id' | 'created_at' | 'status'>
): Promise<Project> {
  const project: Project = {
    ...data,
    id: crypto.randomUUID(),
    status: 'active',
    created_at: Date.now(),
  };
  await db.projects.add(project);
  return project;
}

export async function updateProject(
  id: string,
  changes: Partial<Omit<Project, 'id'>>
): Promise<void> {
  await db.projects.update(id, changes);
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
  // Cascade: delete associated tasks and sessions
  await db.tasks.where('project_id').equals(id).delete();
  await db.sessions.where('project_id').equals(id).delete();
}

export async function getArchivedProjects(): Promise<Project[]> {
  return db.projects.where('status').equals('archived').reverse().sortBy('created_at');
}

export async function archiveProject(id: string): Promise<void> {
  await db.projects.update(id, { status: 'archived' });
}

export async function unarchiveProject(id: string): Promise<void> {
  await db.projects.update(id, { status: 'active' });
}

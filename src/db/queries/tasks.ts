import { db } from '../schema';
import type { Task } from '@/types';

export async function getAllTasks(): Promise<Task[]> {
  return db.tasks.orderBy('created_at').reverse().toArray();
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  return db.tasks.where('project_id').equals(projectId).reverse().sortBy('created_at');
}

export async function getActiveTasks(): Promise<Task[]> {
  return db.tasks.filter((t) => !t.is_completed).toArray();
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  return db.tasks.get(id);
}

export async function createTask(data: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
  const task: Task = {
    ...data,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  };
  await db.tasks.add(task);
  return task;
}

export async function updateTask(id: string, changes: Partial<Omit<Task, 'id'>>): Promise<void> {
  await db.tasks.update(id, changes);
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
  await db.sessions.where('task_id').equals(id).delete();
}

export async function toggleTaskCompletion(id: string): Promise<void> {
  const task = await db.tasks.get(id);
  if (task) {
    await db.tasks.update(id, { is_completed: !task.is_completed });
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../schema';
import {
  createTask,
  updateTask,
  deleteTask,
  getAllTasks,
  getTasksByProject,
  getActiveTasks,
  toggleTaskCompletion,
} from '../tasks';
import { createProject } from '../projects';

describe('task queries', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.projects.clear();
    await db.sessions.clear();
  });

  it('creates a task with generated id', async () => {
    const task = await createTask({ name: 'Test Task', is_completed: false });
    expect(task.id).toBeDefined();
    expect(task.name).toBe('Test Task');
    expect(task.is_completed).toBe(false);
    expect(task.created_at).toBeGreaterThan(0);
  });

  it('creates a task linked to a project', async () => {
    const project = await createProject({ name: 'Test', color: 'blue' });
    const task = await createTask({
      name: 'Linked Task',
      is_completed: false,
      project_id: project.id,
    });

    expect(task.project_id).toBe(project.id);
  });

  it('retrieves all tasks ordered by created_at desc', async () => {
    await createTask({ name: 'First', is_completed: false });
    await createTask({ name: 'Second', is_completed: false });

    const tasks = await getAllTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0].created_at).toBeGreaterThanOrEqual(tasks[1].created_at);
  });

  it('filters tasks by project', async () => {
    const project = await createProject({ name: 'Test', color: 'blue' });
    await createTask({ name: 'Project Task', is_completed: false, project_id: project.id });
    await createTask({ name: 'Standalone Task', is_completed: false });

    const projectTasks = await getTasksByProject(project.id);
    expect(projectTasks).toHaveLength(1);
    expect(projectTasks[0].name).toBe('Project Task');
  });

  it('filters active (incomplete) tasks', async () => {
    await createTask({ name: 'Active', is_completed: false });
    await createTask({ name: 'Done', is_completed: true });

    const activeTasks = await getActiveTasks();
    expect(activeTasks).toHaveLength(1);
    expect(activeTasks[0].name).toBe('Active');
  });

  it('toggles task completion', async () => {
    const task = await createTask({ name: 'Toggle Me', is_completed: false });
    await toggleTaskCompletion(task.id);

    let updated = await db.tasks.get(task.id);
    expect(updated?.is_completed).toBe(true);

    await toggleTaskCompletion(task.id);
    updated = await db.tasks.get(task.id);
    expect(updated?.is_completed).toBe(false);
  });

  it('updates a task', async () => {
    const task = await createTask({ name: 'Old Name', is_completed: false });
    await updateTask(task.id, { name: 'New Name', is_completed: true });

    const updated = await db.tasks.get(task.id);
    expect(updated?.name).toBe('New Name');
    expect(updated?.is_completed).toBe(true);
  });

  it('deletes a task and cascades to sessions', async () => {
    const task = await createTask({ name: 'Delete Me', is_completed: false });
    await db.sessions.add({
      id: 'session-1',
      task_id: task.id,
      type: 'focus',
      started_at: Date.now(),
      duration_seconds: 100,
      phase_number: 1,
      completed: true,
    });

    await deleteTask(task.id);

    expect(await db.tasks.get(task.id)).toBeUndefined();
    expect(await db.sessions.get('session-1')).toBeUndefined();
  });
});

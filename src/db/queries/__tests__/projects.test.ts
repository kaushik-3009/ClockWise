import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../schema';
import {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getActiveProjects,
  getArchivedProjects,
  archiveProject,
  unarchiveProject,
} from '../projects';

describe('project queries', () => {
  beforeEach(async () => {
    await db.projects.clear();
    await db.tasks.clear();
    await db.sessions.clear();
  });

  it('creates a project with generated id and active status', async () => {
    const project = await createProject({ name: 'Test', color: 'blue' });
    expect(project.id).toBeDefined();
    expect(project.status).toBe('active');
    expect(project.name).toBe('Test');
    expect(project.created_at).toBeGreaterThan(0);
  });

  it('retrieves all projects ordered by created_at desc', async () => {
    await createProject({ name: 'First', color: 'blue' });
    await createProject({ name: 'Second', color: 'red' });

    const projects = await getAllProjects();
    expect(projects).toHaveLength(2);
    expect(projects[0].created_at).toBeGreaterThanOrEqual(projects[1].created_at);
  });

  it('filters active projects', async () => {
    const active = await createProject({ name: 'Active', color: 'blue' });
    const archived = await createProject({ name: 'Archived', color: 'red' });
    await archiveProject(archived.id);

    const activeProjects = await getActiveProjects();
    expect(activeProjects).toHaveLength(1);
    expect(activeProjects[0].id).toBe(active.id);
  });

  it('filters archived projects', async () => {
    await createProject({ name: 'Active', color: 'blue' });
    const archived = await createProject({ name: 'Archived', color: 'red' });
    await archiveProject(archived.id);

    const archivedProjects = await getArchivedProjects();
    expect(archivedProjects).toHaveLength(1);
    expect(archivedProjects[0].name).toBe('Archived');
  });

  it('archives and unarchives a project', async () => {
    const project = await createProject({ name: 'Test', color: 'blue' });
    await archiveProject(project.id);
    let updated = await db.projects.get(project.id);
    expect(updated?.status).toBe('archived');

    await unarchiveProject(project.id);
    updated = await db.projects.get(project.id);
    expect(updated?.status).toBe('active');
  });

  it('updates a project', async () => {
    const project = await createProject({ name: 'Test', color: 'blue' });
    await updateProject(project.id, { name: 'Updated', color: 'green' });

    const updated = await db.projects.get(project.id);
    expect(updated?.name).toBe('Updated');
    expect(updated?.color).toBe('green');
  });

  it('deletes a project and cascades to tasks and sessions', async () => {
    const project = await createProject({ name: 'Test', color: 'blue' });
    await db.tasks.add({
      id: 'task-1',
      project_id: project.id,
      name: 'Task',
      is_completed: false,
      created_at: Date.now(),
    });
    await db.sessions.add({
      id: 'session-1',
      project_id: project.id,
      type: 'focus',
      started_at: Date.now(),
      duration_seconds: 100,
      phase_number: 1,
      completed: true,
    });

    await deleteProject(project.id);

    expect(await db.projects.get(project.id)).toBeUndefined();
    expect(await db.tasks.get('task-1')).toBeUndefined();
    expect(await db.sessions.get('session-1')).toBeUndefined();
  });
});

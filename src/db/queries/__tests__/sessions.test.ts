import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../schema';
import {
  createSession,
  updateSession,
  deleteSession,
  getAllSessions,
  getSessionsByProject,
  getSessionsInRange,
} from '../sessions';
import { createProject } from '../projects';

describe('session queries', () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.projects.clear();
  });

  it('creates a session with generated id', async () => {
    const session = await createSession({
      type: 'focus',
      started_at: Date.now(),
      duration_seconds: 0,
      phase_number: 1,
      completed: false,
    });
    expect(session.id).toBeDefined();
    expect(session.type).toBe('focus');
    expect(session.completed).toBe(false);
  });

  it('retrieves all sessions ordered by started_at desc', async () => {
    const now = Date.now();
    await createSession({
      type: 'focus',
      started_at: now - 1000,
      duration_seconds: 100,
      phase_number: 1,
      completed: true,
    });
    await createSession({
      type: 'focus',
      started_at: now,
      duration_seconds: 200,
      phase_number: 1,
      completed: true,
    });

    const sessions = await getAllSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].started_at).toBeGreaterThanOrEqual(sessions[1].started_at);
  });

  it('updates a session', async () => {
    const session = await createSession({
      type: 'focus',
      started_at: Date.now(),
      duration_seconds: 0,
      phase_number: 1,
      completed: false,
    });

    await updateSession(session.id, { completed: true, duration_seconds: 1500 });
    const updated = await db.sessions.get(session.id);
    expect(updated?.completed).toBe(true);
    expect(updated?.duration_seconds).toBe(1500);
  });

  it('deletes a session', async () => {
    const session = await createSession({
      type: 'focus',
      started_at: Date.now(),
      duration_seconds: 0,
      phase_number: 1,
      completed: false,
    });

    await deleteSession(session.id);
    const deleted = await db.sessions.get(session.id);
    expect(deleted).toBeUndefined();
  });

  it('filters sessions by project', async () => {
    const project = await createProject({ name: 'Test', color: 'blue' });
    await createSession({
      project_id: project.id,
      type: 'focus',
      started_at: Date.now(),
      duration_seconds: 100,
      phase_number: 1,
      completed: true,
    });
    await createSession({
      type: 'focus',
      started_at: Date.now(),
      duration_seconds: 100,
      phase_number: 1,
      completed: true,
    });

    const projectSessions = await getSessionsByProject(project.id);
    expect(projectSessions).toHaveLength(1);
    expect(projectSessions[0].project_id).toBe(project.id);
  });

  it('filters sessions by date range', async () => {
    const now = Date.now();
    await createSession({
      type: 'focus',
      started_at: now - 10000,
      duration_seconds: 100,
      phase_number: 1,
      completed: true,
    });
    await createSession({
      type: 'focus',
      started_at: now,
      duration_seconds: 100,
      phase_number: 1,
      completed: true,
    });

    const sessions = await getSessionsInRange(now - 5000, now + 1000);
    expect(sessions).toHaveLength(1);
  });
});

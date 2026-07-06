import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { formatDateKey } from '@/lib/time';
import { DEFAULT_SETTINGS } from '@/db/queries/settings';
import type { Project, Task, Session, DailyStreak, TimerTemplate } from '@/types';

const PROJECT_SEEDS: Omit<Project, 'id' | 'created_at' | 'user_id'>[] = [
  {
    name: 'University',
    description: 'Bachelor degree coursework and assignments',
    color: 'blue',
    status: 'active',
  },
  {
    name: 'Side Hustle',
    description: 'Freelance web development projects',
    color: 'orange',
    status: 'active',
  },
  {
    name: 'Fitness',
    description: 'Workout planning and meal prep',
    color: 'green',
    status: 'active',
  },
  { name: 'Reading', description: 'Books and articles backlog', color: 'purple', status: 'active' },
  { name: 'Language Learning', description: 'Japanese N2 prep', color: 'teal', status: 'active' },
  {
    name: 'Open Source',
    description: 'Contributions to Dexie and other tools',
    color: 'slate',
    status: 'active',
  },
  {
    name: 'Music Production',
    description: 'Ableton projects and mixing',
    color: 'red',
    status: 'active',
  },
  {
    name: 'Gardening',
    description: 'Vegetable patch planning',
    color: 'yellow',
    status: 'archived',
  },
];

const TASK_SEEDS: { name: string; projectIndex: number }[] = [
  { name: 'Economics II Essay', projectIndex: 0 },
  { name: 'Maths Problem Set 4', projectIndex: 0 },
  { name: 'Physics Lab Report', projectIndex: 0 },
  { name: 'History Reading Notes', projectIndex: 0 },
  { name: 'Client Landing Page', projectIndex: 1 },
  { name: 'Invoice Dashboard', projectIndex: 1 },
  { name: 'API Integration', projectIndex: 1 },
  { name: 'Leg Day Routine', projectIndex: 2 },
  { name: 'Meal Prep Sunday', projectIndex: 2 },
  { name: 'Deep Work by Cal Newport', projectIndex: 3 },
  { name: 'Atomic Habits review', projectIndex: 3 },
  { name: 'Kanji Drill Set 12', projectIndex: 4 },
  { name: 'Listening Practice NHK', projectIndex: 4 },
  { name: 'Grammar Workbook Ch.5', projectIndex: 4 },
  { name: 'Dexie Docs Update', projectIndex: 5 },
  { name: 'Bug fix #442', projectIndex: 5 },
  { name: 'Track arrangement — Midnight', projectIndex: 6 },
  { name: 'Mixing vocals', projectIndex: 6 },
  { name: 'Compost planning', projectIndex: 7 },
  { name: 'Seed order', projectIndex: 7 },
];

const DEFAULT_TEMPLATES: Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>[] = [
  {
    name: 'Classic Pomodoro',
    focus_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    phases_per_session: 8,
    long_break_after_n: 4,
  },
  {
    name: 'Deep Work',
    focus_minutes: 50,
    short_break_minutes: 10,
    long_break_minutes: 30,
    phases_per_session: 4,
    long_break_after_n: 2,
  },
  {
    name: 'Quick Sprint',
    focus_minutes: 15,
    short_break_minutes: 3,
    long_break_minutes: 10,
    phases_per_session: 6,
    long_break_after_n: 3,
  },
  {
    name: 'Study Session',
    focus_minutes: 45,
    short_break_minutes: 10,
    long_break_minutes: 20,
    phases_per_session: 10,
    long_break_after_n: 3,
  },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function stripUndefinedSession(obj: Session): Session {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as unknown as Record<string, unknown>)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as unknown as Session;
}

function weightedPick<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

async function hasExistingData(userId: string): Promise<boolean> {
  const db = getFirebaseFirestore();
  const [projectsSnap, templatesSnap] = await Promise.all([
    getDocs(collection(db, 'users', userId, 'projects')),
    getDocs(collection(db, 'users', userId, 'templates')),
  ]);
  return projectsSnap.size > 0 || templatesSnap.size > 0;
}

export async function seedNewUser(userId: string, includeDemoData = true): Promise<void> {
  if (!includeDemoData) {
    await seedDefaultsOnly(userId);
    return;
  }

  console.log('[seed] Starting seed for user:', userId);

  try {
    const hasData = await hasExistingData(userId);
    if (hasData) {
      console.log('[seed] User already has data, skipping seed.');
      return;
    }
  } catch (err) {
    console.error('[seed] Failed to check existing data (rules not deployed?):', err);
    throw err;
  }

  console.log('[seed] Populating demo data...');
  const db = getFirebaseFirestore();
  const batch = writeBatch(db);
  const now = Date.now();

  // Insert projects
  const projects: Project[] = PROJECT_SEEDS.map((p) => ({
    ...p,
    user_id: userId,
    id: crypto.randomUUID(),
    created_at: now - randInt(0, 90 * 24 * 60 * 60 * 1000),
  }));
  const projectCol = collection(db, 'users', userId, 'projects');
  projects.forEach((p) => batch.set(doc(projectCol, p.id), p));

  // Insert tasks
  const tasks: Task[] = TASK_SEEDS.map((t) => {
    const createdAt = now - randInt(7 * 24 * 60 * 60 * 1000, 85 * 24 * 60 * 60 * 1000);
    const ageDays = (now - createdAt) / (24 * 60 * 60 * 1000);
    const completionChance = Math.min(0.2 + ageDays * 0.015, 0.85);
    return {
      user_id: userId,
      id: crypto.randomUUID(),
      project_id: projects[t.projectIndex].id,
      name: t.name,
      is_completed: Math.random() < completionChance,
      created_at: createdAt,
    };
  });
  const taskCol = collection(db, 'users', userId, 'tasks');
  tasks.forEach((t) => batch.set(doc(taskCol, t.id), t));

  // Generate sessions
  const sessions: Session[] = [];
  const activeProjectsList = projects.filter((p) => p.status === 'active');
  const activeTasksList = tasks.filter((t) => !t.is_completed);

  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const dayBase = new Date(now);
    dayBase.setHours(0, 0, 0, 0);
    dayBase.setDate(dayBase.getDate() - dayOffset);
    const dayOfWeek = dayBase.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let sessionCount: number;
    if (isWeekend) {
      sessionCount = weightedPick([0, 1, 2], [0.35, 0.45, 0.2]);
    } else {
      sessionCount = weightedPick([0, 1, 2, 3, 4], [0.05, 0.15, 0.35, 0.35, 0.1]);
    }

    if (dayOffset < 89) {
      const yesterdayHadSessions = sessions.some((s) => {
        const d = new Date(s.started_at);
        d.setHours(0, 0, 0, 0);
        const yesterday = new Date(now);
        yesterday.setHours(0, 0, 0, 0);
        yesterday.setDate(yesterday.getDate() - dayOffset - 1);
        return d.getTime() === yesterday.getTime();
      });
      if (yesterdayHadSessions && Math.random() < 0.8 && sessionCount === 0) {
        sessionCount = randInt(1, 2);
      }
    }

    if (sessionCount === 0) continue;

    const startHour = weightedPick(
      [7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21],
      [0.08, 0.15, 0.18, 0.12, 0.05, 0.08, 0.12, 0.1, 0.05, 0.03, 0.02, 0.01, 0.01]
    );

    let hour = startHour;

    for (let s = 0; s < sessionCount; s++) {
      const projectWeights = activeProjectsList.map((_, i) =>
        i === 0 ? 1.5 : i === 1 ? 1.3 : 1.0
      );
      const project = weightedPick(activeProjectsList, projectWeights);
      const projectTasks = activeTasksList.filter((t) => t.project_id === project.id);
      const task = projectTasks.length > 0 ? pick(projectTasks) : undefined;

      const focusDuration = randInt(20, 28) * 60;
      const breakDuration = randInt(4, 7) * 60;
      const completed = Math.random() > 0.12;

      const startedAt = new Date(dayBase);
      startedAt.setHours(hour, randInt(0, 59), randInt(0, 59), 0);

      sessions.push({
        user_id: userId,
        id: crypto.randomUUID(),
        project_id: project.id,
        task_id: task?.id,
        type: 'focus',
        started_at: startedAt.getTime(),
        ended_at: completed ? startedAt.getTime() + focusDuration * 1000 : undefined,
        duration_seconds: completed ? focusDuration : randInt(5 * 60, focusDuration),
        phase_number: 1,
        completed,
      });

      if (Math.random() > 0.3) {
        const breakStart = new Date(startedAt);
        breakStart.setMinutes(breakStart.getMinutes() + Math.floor(focusDuration / 60));
        sessions.push({
          user_id: userId,
          id: crypto.randomUUID(),
          project_id: project.id,
          task_id: task?.id,
          type: 'short_break',
          started_at: breakStart.getTime(),
          ended_at: breakStart.getTime() + breakDuration * 1000,
          duration_seconds: breakDuration,
          phase_number: 1,
          completed: true,
        });
      }

      if ((s + 1) % 4 === 0 && s < sessionCount - 1) {
        const longBreakDuration = randInt(12, 18) * 60;
        const longBreakStart = new Date(dayBase);
        longBreakStart.setHours(hour + 1, randInt(0, 59), 0, 0);
        sessions.push({
          user_id: userId,
          id: crypto.randomUUID(),
          project_id: project.id,
          task_id: task?.id,
          type: 'long_break',
          started_at: longBreakStart.getTime(),
          ended_at: longBreakStart.getTime() + longBreakDuration * 1000,
          duration_seconds: longBreakDuration,
          phase_number: 1,
          completed: true,
        });
        hour += 2;
      } else {
        hour += 1 + randInt(0, 1);
      }
    }
  }

  const sessionCol = collection(db, 'users', userId, 'sessions');
  sessions.forEach((s) => batch.set(doc(sessionCol, s.id), stripUndefinedSession(s)));

  // Build streaks from sessions
  const streakMap = new Map<string, DailyStreak>();
  for (const s of sessions) {
    if (s.type !== 'focus') continue;
    const dateKey = formatDateKey(new Date(s.started_at));
    const existing = streakMap.get(dateKey);
    if (existing) {
      existing.focus_seconds += s.duration_seconds;
      existing.sessions_started += 1;
      if (s.completed) existing.sessions_completed += 1;
      existing.goal_met = existing.focus_seconds >= 25 * 60;
    } else {
      streakMap.set(dateKey, {
        user_id: userId,
        date: dateKey,
        focus_seconds: s.duration_seconds,
        sessions_started: 1,
        sessions_completed: s.completed ? 1 : 0,
        goal_met: s.duration_seconds >= 25 * 60,
      });
    }
  }
  const streakCol = collection(db, 'users', userId, 'streaks');
  Array.from(streakMap.values()).forEach((st) => batch.set(doc(streakCol, st.date), st));

  try {
    await batch.commit();
    console.log('[seed] Batch commit succeeded');
  } catch (err) {
    console.error('[seed] Batch commit failed:', err);
    throw err;
  }

  await seedDefaultsOnly(userId);

  console.log(
    `[seed] Done: ${projects.length} projects, ${tasks.length} tasks, ${sessions.length} sessions, ${streakMap.size} streak days.`
  );
}

export async function seedDefaultsOnly(userId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const templatesCol = collection(db, 'users', userId, 'templates');
  const existing = await getDocs(templatesCol);
  if (existing.size > 0) return;

  const now = Date.now();
  const batch = writeBatch(db);
  DEFAULT_TEMPLATES.forEach((t) => {
    const id = crypto.randomUUID();
    batch.set(doc(templatesCol, id), { ...t, user_id: userId, id, created_at: now });
  });

  // Ensure default settings document exists
  batch.set(doc(db, 'users', userId, 'settings', 'default'), DEFAULT_SETTINGS);

  await batch.commit();
}

export async function clearUserData(userId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const collections = [
    'projects',
    'tasks',
    'sessions',
    'streaks',
    'templates',
    'settings',
  ] as const;
  for (const name of collections) {
    const snap = await getDocs(collection(db, 'users', userId, name));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`[seed] Cleared data for user ${userId}.`);
}

export async function seedUserDemoData(userId: string): Promise<void> {
  await clearUserData(userId);
  await seedNewUser(userId, true);
}

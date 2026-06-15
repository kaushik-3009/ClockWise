import { db } from './schema';
import { formatDateKey } from '@/lib/time';
import type { Project, Task, Session, DailyStreak, TimerTemplate } from '@/types';

const PROJECT_SEEDS: Omit<Project, 'id' | 'created_at'>[] = [
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

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
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

/** Expose for manual console use: window.seedClockWise() */
async function _seed(force = false): Promise<void> {
  await db.open();

  // Check if already seeded
  if (!force) {
    const existingProjects = await db.projects.count();
    if (existingProjects > 0) {
      console.log('[seed] Database already has data, skipping seed.');
      return;
    }
  }

  console.log('[seed] Populating demo data...');

  // Insert projects
  const now = Date.now();
  const projects: Project[] = PROJECT_SEEDS.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
    created_at: now - randInt(0, 90 * 24 * 60 * 60 * 1000),
  }));
  await db.projects.bulkAdd(projects);

  // Insert tasks with realistic completion over time
  const tasks: Task[] = TASK_SEEDS.map((t) => {
    const createdAt = now - randInt(7 * 24 * 60 * 60 * 1000, 85 * 24 * 60 * 60 * 1000);
    // Older tasks more likely completed
    const ageDays = (now - createdAt) / (24 * 60 * 60 * 1000);
    const completionChance = Math.min(0.2 + ageDays * 0.015, 0.85);
    return {
      id: crypto.randomUUID(),
      project_id: projects[t.projectIndex].id,
      name: t.name,
      is_completed: Math.random() < completionChance,
      created_at: createdAt,
    };
  });
  await db.tasks.bulkAdd(tasks);

  // Generate sessions for last 90 days with realistic patterns
  const sessions: Session[] = [];
  const activeProjectsList = projects.filter((p) => p.status === 'active');
  const activeTasksList = tasks.filter((t) => !t.is_completed);

  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const dayBase = new Date(now);
    dayBase.setHours(0, 0, 0, 0);
    dayBase.setDate(dayBase.getDate() - dayOffset);
    const dayOfWeek = dayBase.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Determine session count based on day type and streak patterns
    let sessionCount: number;
    if (isWeekend) {
      sessionCount = weightedPick([0, 1, 2], [0.35, 0.45, 0.2]);
    } else {
      // Weekdays: more productive, with some variation
      sessionCount = weightedPick([0, 1, 2, 3, 4], [0.05, 0.15, 0.35, 0.35, 0.1]);
    }

    // Simulate streaks: if yesterday had sessions, 80% chance today does too
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

    // Pick starting hour with realistic distribution (morning peak, afternoon, evening)
    const startHour = weightedPick(
      [7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21],
      [0.08, 0.15, 0.18, 0.12, 0.05, 0.08, 0.12, 0.1, 0.05, 0.03, 0.02, 0.01, 0.01]
    );

    let hour = startHour;

    for (let s = 0; s < sessionCount; s++) {
      // Pick project with weighted preference (some projects get more time)
      const projectWeights = activeProjectsList.map((_, i) =>
        i === 0 ? 1.5 : i === 1 ? 1.3 : 1.0
      );
      const project = weightedPick(activeProjectsList, projectWeights);
      const projectTasks = activeTasksList.filter((t) => t.project_id === project.id);
      const task = projectTasks.length > 0 ? pick(projectTasks) : undefined;

      const focusDuration = randInt(20, 28) * 60; // 20-28 min focus
      const breakDuration = randInt(4, 7) * 60; // 4-7 min break
      const completed = Math.random() > 0.12; // 88% completion rate

      const startedAt = new Date(dayBase);
      startedAt.setHours(hour, randInt(0, 59), randInt(0, 59), 0);

      sessions.push({
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

      // Add break after ~70% of focus sessions
      if (Math.random() > 0.3) {
        const breakStart = new Date(startedAt);
        breakStart.setMinutes(breakStart.getMinutes() + Math.floor(focusDuration / 60));
        sessions.push({
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

      // Add long break after every 4th session in a day (simulating pomodoro cycles)
      if ((s + 1) % 4 === 0 && s < sessionCount - 1) {
        const longBreakDuration = randInt(12, 18) * 60;
        const longBreakStart = new Date(dayBase);
        longBreakStart.setHours(hour + 1, randInt(0, 59), 0, 0);
        sessions.push({
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

  await db.sessions.bulkAdd(sessions);

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
        date: dateKey,
        focus_seconds: s.duration_seconds,
        sessions_started: 1,
        sessions_completed: s.completed ? 1 : 0,
        goal_met: s.duration_seconds >= 25 * 60,
      });
    }
  }
  await db.streaks.bulkAdd(Array.from(streakMap.values()));

  // Default templates
  const defaultTemplates: Omit<TimerTemplate, 'id' | 'created_at'>[] = [
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
  await db.templates.bulkAdd(
    defaultTemplates.map((t) => ({ ...t, id: crypto.randomUUID(), created_at: now }))
  );

  // Default settings
  await db.settings.put({
    focus_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    phases_per_session: 8,
    long_break_after_n: 4,
    auto_start: false,
    sound_enabled: true,
    notifications_enabled: false,
    timer_style: 'digital',
    accent_color: '#E8521A',
    ambient_sound: 'off',
    ambient_volume: 0.3,
    weekly_goal_hours: 20,
    warn_before_seconds: 60,
    id: 1,
  });

  console.log(
    `[seed] Done: ${projects.length} projects, ${tasks.length} tasks, ${sessions.length} sessions, ${streakMap.size} streak days.`
  );
}

export async function seedDatabase(force = false): Promise<void> {
  try {
    await _seed(force);
  } catch (err) {
    console.error('[seed] Failed to seed database:', err);
    throw err;
  }
}

export async function clearDatabase(): Promise<void> {
  await db.open();
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
  console.log('[seed] Database cleared.');
}

// Expose for debugging in development only
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).seedClockWise = seedDatabase;
  (window as unknown as Record<string, unknown>).clearClockWise = clearDatabase;
}

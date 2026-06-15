import { db } from '../schema';
import type { DailyStreak } from '@/types';

export async function getAllStreaks(): Promise<DailyStreak[]> {
  return db.streaks.orderBy('date').toArray();
}

export async function getStreakByDate(date: string): Promise<DailyStreak | undefined> {
  return db.streaks.get(date);
}

export async function upsertStreak(streak: DailyStreak): Promise<void> {
  await db.streaks.put(streak);
}

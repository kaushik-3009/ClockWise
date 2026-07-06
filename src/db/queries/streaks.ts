import { collection, doc, getDoc, setDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import type { DailyStreak } from '@/types';

function streaksRef(userId: string) {
  return collection(getFirebaseFirestore(), 'users', userId, 'streaks');
}

function streakRef(userId: string, date: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'streaks', date);
}

export async function getAllStreaks(userId: string): Promise<DailyStreak[]> {
  const q = query(streaksRef(userId), orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ ...(d.data() as DailyStreak), date: d.id }));
}

export async function getStreakByDate(
  userId: string,
  date: string
): Promise<DailyStreak | undefined> {
  const snapshot = await getDoc(streakRef(userId, date));
  if (!snapshot.exists()) return undefined;
  return { ...(snapshot.data() as DailyStreak), date: snapshot.id };
}

export async function upsertStreak(userId: string, streak: DailyStreak): Promise<void> {
  await setDoc(streakRef(userId, streak.date), { ...streak, date: streak.date }, { merge: true });
}

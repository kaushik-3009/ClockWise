import { useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { useData } from '@/hooks/useData';
import { normalizeSettings } from '@/db/parse';
import { reportFailure } from '@/components/ui/Toast';
import { useTimerStore } from '@/stores/timerStore';
import type { TimerSettings } from '@/types';

export function useSettings() {
  const { user } = useAuth();
  const { settings, loading } = useData();
  const uid = user?.uid;

  const saveSettings = useCallback(
    (partial: Partial<TimerSettings>) => {
      if (!uid) return;
      // Merge over the latest settings the timer knows about (not a possibly
      // stale render-time copy), then clamp so bad input can't reach the timer.
      const next = normalizeSettings({ ...useTimerStore.getState().settings, ...partial });
      useTimerStore.getState().setSettings(next);
      const ref = doc(getFirebaseFirestore(), 'users', uid, 'settings', 'default');
      reportFailure(setDoc(ref, next), "Couldn't save settings");
    },
    [uid]
  );

  return { settings, loading: loading.settings, saveSettings };
}

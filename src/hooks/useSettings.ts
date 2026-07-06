import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { DEFAULT_SETTINGS } from '@/db/queries/settings';
import type { TimerSettings } from '@/types';
import { useTimerStore } from '@/stores/timerStore';

const SETTINGS_DOC_ID = 'default';

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettingsState] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (!user) {
      setSettingsState(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = doc(getFirebaseFirestore(), 'users', user.uid, 'settings', SETTINGS_DOC_ID);
    return onSnapshot(
      ref,
      (snapshot) => {
        const next = snapshot.exists() ? (snapshot.data() as TimerSettings) : DEFAULT_SETTINGS;
        setSettingsState(next);
        useTimerStore.getState().setSettings(next);
        if (/^#[0-9a-fA-F]{6}$/.test(next.accent_color)) {
          document.documentElement.style.setProperty('--color-brand', next.accent_color);
        }
        setLoading(false);
      },
      (error) => {
        console.error('[useSettings] Snapshot error:', error);
      }
    );
  }, [user]);

  const saveSettings = useCallback(
    async (partial: Partial<TimerSettings>) => {
      if (!user) throw new Error('Not authenticated');
      const next = { ...settingsRef.current, ...partial };
      const ref = doc(getFirebaseFirestore(), 'users', user.uid, 'settings', SETTINGS_DOC_ID);
      await setDoc(ref, next);
      useTimerStore.getState().setSettings(partial);
    },
    [user]
  );

  return {
    settings,
    loading,
    saveSettings,
  };
}

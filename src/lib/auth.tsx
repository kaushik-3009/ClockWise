import { useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, resetFirestore } from './firebase';
import { AuthContext } from './authContext';
import { useTimerStore } from '@/stores/timerStore';
import { stopAmbient } from '@/lib/ambient';
import { stopLofi } from '@/stores/lofiStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const logIn = useCallback(async (email: string, password: string) => {
    return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }, []);

  const logOut = useCallback(async () => {
    // Clear everything tied to this account before the next person signs in on
    // this device: the running timer, audio, and Firestore's offline cache.
    stopAmbient();
    stopLofi();
    useTimerStore.getState().resetForUser(null);
    await signOut(getFirebaseAuth());
    await resetFirestore();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

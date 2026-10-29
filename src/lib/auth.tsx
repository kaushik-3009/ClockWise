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
import { timerFlushBeforeLogout } from '@/lib/timerController';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let previousUid: string | null | undefined;
    return onAuthStateChanged(auth, async (currentUser) => {
      const uid = currentUser?.uid ?? null;
      const switched = previousUid != null && uid !== null && uid !== previousUid;
      const signedOut = previousUid != null && uid === null;
      previousUid = uid;
      // Signing out in another tab only reaches this tab through here, so wipe
      // this tab's Firestore instance too; otherwise it keeps serving the previous
      // account's cache. (After a sign-out the listeners unmount first.)
      if (switched) await resetFirestore();
      setUser(currentUser);
      setLoading(false);
      if (signedOut) void resetFirestore();
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
    await timerFlushBeforeLogout();
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

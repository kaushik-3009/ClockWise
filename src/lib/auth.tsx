import { useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { AuthContext } from './authContext';

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
    const auth = getFirebaseAuth();
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const logIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    return signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext } from 'react';
import type { User, UserCredential } from 'firebase/auth';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  logIn: (email: string, password: string) => Promise<UserCredential>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

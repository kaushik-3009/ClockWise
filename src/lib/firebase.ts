import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  terminate,
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasRequiredConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

/**
 * Local development and testing against `npm run emulators` (see README). Opt-in
 * via an env var set at build/dev time; production deploys never set it.
 */
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!hasRequiredConfig()) {
      throw new Error(
        'Firebase configuration is missing. Set VITE_FIREBASE_* environment variables.'
      );
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
}

let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    // initializeAuth (instead of getAuth) skips the popup/redirect resolver.
    // We only use email/password, and the resolver loads apis.google.com/js/api.js
    // plus an auth iframe — on iOS that blocks onAuthStateChanged until it loads
    // or times out, which shows up as an endless spinner on launch.
    auth = initializeAuth(getFirebaseApp(), {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
    });
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
  }
  return auth;
}

let firestore: Firestore | null = null;

export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    const base = { ignoreUndefinedProperties: true } as const;
    try {
      // Persistent local cache enables offline reads/writes (synced when back online)
      // and works across multiple open tabs.
      firestore = initializeFirestore(getFirebaseApp(), {
        ...base,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch (err) {
      // IndexedDB can be unavailable (private mode, storage pressure on iOS).
      // Fall back to an in-memory cache rather than failing to start.
      console.warn('[firebase] Persistent cache unavailable, using memory cache:', err);
      firestore = initializeFirestore(getFirebaseApp(), {
        ...base,
        localCache: memoryLocalCache(),
      });
    }
    if (useEmulators) connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }
  return firestore;
}

/**
 * Shut down Firestore and wipe its on-device cache so the next account to sign in
 * on this device can't see the previous user's data. A fresh instance is created
 * on the next getFirebaseFirestore() call.
 */
export async function resetFirestore(): Promise<void> {
  if (!firestore) return;
  const db = firestore;
  firestore = null;
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (err) {
    console.warn('[firebase] Could not clear local cache:', err);
  }
}

/**
 * Firestore's IndexedDB layer can die after iOS suspends and resumes the PWA
 * ("IndexedDB connection lost" / "INTERNAL ASSERTION FAILED"). Once that happens
 * every listener is dead, so the only reliable recovery is a reload.
 */
export function isFatalFirestoreError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /INTERNAL ASSERTION FAILED|IndexedDB|database connection is closing/i.test(message);
}

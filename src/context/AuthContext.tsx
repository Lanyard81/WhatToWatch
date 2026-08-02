import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Modern Firebase Auth returns 'invalid-credential' for both "no such
      // account" and "wrong password" (to avoid leaking which one it is), so
      // we can't tell them apart from the sign-in error alone. Instead, try
      // creating the account — that only succeeds if the email genuinely
      // isn't registered yet, which gives first-time users a Google-like
      // "just works" sign-in without a separate sign-up step. If creation
      // fails because the email IS already in use, the original failure was
      // really a wrong password, so we surface that instead.
      if (code !== 'auth/user-not-found' && code !== 'auth/invalid-credential') throw err;
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (createErr) {
        const createCode = (createErr as { code?: string }).code;
        if (createCode === 'auth/email-already-in-use') throw err;
        throw createErr;
      }
    }
  }

  async function loginWithGoogle() {
    // Popup (not redirect): more reliable on Safari, whose tracking protection
    // can drop the session during the storage handoff a redirect round-trip needs.
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

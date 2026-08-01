import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  redirectError: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        console.log('[auth] getRedirectResult resolved:', result ? `user ${result.user.uid}` : 'no pending redirect');
      })
      .catch((err) => {
        console.error('[auth] getRedirectResult error:', err);
        setRedirectError((err as { code?: string }).code ?? 'unknown');
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[auth] onAuthStateChanged:', firebaseUser ? firebaseUser.uid : 'signed out');
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    await signInWithRedirect(auth, new GoogleAuthProvider());
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, redirectError, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

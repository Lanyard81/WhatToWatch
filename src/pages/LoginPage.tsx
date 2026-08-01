import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, loginWithGoogle, redirectError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown';
      setError(`Could not sign in (${code}).`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    setGoogleSubmitting(true);
    // Navigates away to Google; the app reloads here once the redirect completes.
    loginWithGoogle();
  }

  return (
    <div className="auth-screen">
      <h1>What To Watch</h1>
      <p className="subtitle">Sign in to your household</p>

      <button type="button" className="secondary" onClick={handleGoogleSignIn} disabled={googleSubmitting}>
        {googleSubmitting ? 'Redirecting…' : 'Sign in with Google'}
      </button>

      {redirectError && <p className="error">Could not sign in ({redirectError}).</p>}

      <p className="hint" style={{ textAlign: 'center' }}>or</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="hint">
        Accounts are created in the Firebase console — this app doesn't support public sign-up.
      </p>
    </div>
  );
}

import { SignInForm } from '../components/SignInForm';

export function LoginPage() {
  return (
    <div className="auth-screen">
      <h1>What To Watch</h1>
      <p className="subtitle">
        A shared watch-list for your household — search for movies and shows, queue up what you
        want to watch, and keep track of what you've finished, with ratings and notes. Everything
        syncs in real time with whoever you share it with.
      </p>
      <p className="hint">Sign in to your household</p>
      <SignInForm />
    </div>
  );
}

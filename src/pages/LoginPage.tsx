import { SignInForm } from '../components/SignInForm';

export function LoginPage() {
  return (
    <div className="auth-screen">
      <h1>What To Watch</h1>
      <p className="subtitle">Sign in to your household</p>
      <SignInForm />
    </div>
  );
}

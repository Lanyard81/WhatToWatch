import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';

export function HouseholdSetupPage() {
  const { user } = useAuth();
  const { createHousehold } = useHousehold();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createHousehold(name.trim() || 'Our Household');
    } catch {
      setError('Could not create household. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <h1>Set up your household</h1>
      <p className="subtitle">
        You're not in a household yet. If someone sent you an invite link, open that instead of
        creating one here — otherwise, create your own below.
      </p>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Household name
          <input
            type="text"
            placeholder="e.g. The Living Room"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create household'}
        </button>
      </form>
      <p className="hint">
        Your user ID is <code>{user?.uid}</code>. Once someone else creates an account, an
        existing member can add them to the household from Settings using this ID.
      </p>
    </div>
  );
}

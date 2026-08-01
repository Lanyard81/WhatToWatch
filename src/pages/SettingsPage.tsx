import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { household, addMemberByUid } = useHousehold();
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      await addMemberByUid(uid.trim());
      setStatus('Member added.');
      setUid('');
    } catch {
      setStatus('Could not add member.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page settings-page">
      <h1>Settings</h1>

      <section>
        <h2>{household?.name}</h2>
        <p className="hint">
          {household?.memberIds.length ?? 0} member{household?.memberIds.length === 1 ? '' : 's'}
        </p>
      </section>

      <section>
        <h3>Add a household member</h3>
        <p className="hint">
          Ask them to sign in once so their account exists, share their user ID with you, then
          add it below.
        </p>
        <form onSubmit={handleAddMember} className="auth-form">
          <label>
            User ID
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Firebase user ID"
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add member'}
          </button>
        </form>
        {status && <p className="hint">{status}</p>}
      </section>

      <section>
        <h3>Your user ID</h3>
        <p className="hint">
          <code>{user?.uid}</code>
        </p>
      </section>

      <button type="button" className="secondary" onClick={() => logout()}>
        Sign out
      </button>
    </div>
  );
}

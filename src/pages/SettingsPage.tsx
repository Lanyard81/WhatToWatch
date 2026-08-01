import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useTheme, ACCENTS, type ThemeMode } from '../context/ThemeContext';
import type { RatingMode } from '../types';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { household, addMemberByUid, updateRatingMode } = useHousehold();
  const { theme, accent, setTheme, setAccent } = useTheme();
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
        <h3>Ratings</h3>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              name="ratingMode"
              checked={household?.ratingMode === 'shared'}
              onChange={() => updateRatingMode('shared' as RatingMode)}
            />
            Shared — one rating per title for the whole household
          </label>
          <label>
            <input
              type="radio"
              name="ratingMode"
              checked={household?.ratingMode === 'individual'}
              onChange={() => updateRatingMode('individual' as RatingMode)}
            />
            Individual — each person rates separately
          </label>
        </div>
      </section>

      <section>
        <h3>Appearance</h3>
        <p className="hint">Theme</p>
        <div className="appearance-row">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={theme === mode ? '' : 'secondary'}
              onClick={() => setTheme(mode)}
            >
              {mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
        <p className="hint">Accent colour</p>
        <div className="appearance-row">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={accent === a.id ? 'swatch-button' : 'swatch-button secondary'}
              onClick={() => setAccent(a.id)}
            >
              <span className="swatch-dot" style={{ background: a.swatch }} />
              {a.label}
            </button>
          ))}
        </div>
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

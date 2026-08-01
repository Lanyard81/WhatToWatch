import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useMembers } from '../hooks/useMembers';
import { useTheme, ACCENTS, type ThemeMode } from '../context/ThemeContext';
import { ImportHistorySection } from '../components/ImportHistorySection';
import { PageHeader } from '../components/PageHeader';
import type { RatingMode } from '../types';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { household, addMemberByUid, updateRatingMode, leaveHousehold } = useHousehold();
  const { members } = useMembers(household?.id);
  const { theme, accent, setTheme, setAccent } = useTheme();
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const inviteLink = household
    ? `${window.location.origin}${import.meta.env.BASE_URL}join/${household.id}`
    : '';

  async function copyInviteLink() {
    await navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await leaveHousehold();
    } finally {
      setLeaving(false);
      setConfirmingLeave(false);
    }
  }

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
      <PageHeader title="Settings" />

      <div className="settings-card">
        <h2>{household?.name}</h2>
        <ul className="member-list">
          {(household?.memberIds ?? []).map((id) => (
            <li key={id}>
              {members.find((m) => m.id === id)?.displayName ?? 'Member'}
              {id === user?.uid ? ' (you)' : ''}
            </li>
          ))}
        </ul>

        <h3>Invite someone</h3>
        <p className="hint">
          Share this link — anyone who opens it can sign in and join straight away, no account
          setup needed on your end. Anyone with the link can join, so only share it with people
          you trust — there's no way to remove a member yet.
        </p>
        <div className="invite-link-row">
          <input type="text" readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={copyInviteLink}>
            {linkCopied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="settings-card">
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
      </div>

      <div className="settings-card">
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
      </div>

      <div className="settings-card">
        <h3>Data</h3>
        <Link to="/stats">
          <button type="button" className="secondary">
            View stats →
          </button>
        </Link>
        <ImportHistorySection />

        <details className="advanced-disclosure">
          <summary>Advanced</summary>

          <div className="advanced-disclosure-body">
            <h3>Add by user ID</h3>
            <p className="hint">
              Fallback if sharing a link isn't convenient: they sign in once so their account
              exists, share their user ID with you, then add it below.
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

            <h3>Your user ID</h3>
            <p className="hint">
              <code>{user?.uid}</code>
            </p>
          </div>
        </details>
      </div>

      <div className="settings-card settings-danger-zone">
        <h3>Danger zone</h3>
        <p className="hint">
          Leaving removes you from "{household?.name}" and its lists. Use this if you set up your
          own household by mistake and want to join someone else's invite link instead.
        </p>
        {confirmingLeave ? (
          <div className="watched-confirm">
            <p className="error">Leave "{household?.name}"?</p>
            <button type="button" className="danger" onClick={handleLeave} disabled={leaving}>
              {leaving ? 'Leaving…' : 'Leave'}
            </button>
            <button type="button" className="secondary" onClick={() => setConfirmingLeave(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="secondary danger-text" onClick={() => setConfirmingLeave(true)}>
            Leave household
          </button>
        )}

        <button type="button" className="secondary" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useHouseholdPreview } from '../hooks/useHouseholdPreview';
import { SignInForm } from '../components/SignInForm';

export function JoinPage() {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading, joinHousehold } = useHousehold();
  const { preview, loading: previewLoading, error: previewError } = useHouseholdPreview(householdId);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleJoin() {
    if (!householdId) return;
    setJoining(true);
    setJoinError(null);
    try {
      await joinHousehold(householdId);
      navigate('/', { replace: true });
    } catch {
      setJoinError('Could not join this household. The link may be invalid or expired.');
    } finally {
      setJoining(false);
    }
  }

  if (authLoading) {
    return <div className="centered-screen">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <h1>What To Watch</h1>
        <p className="subtitle">Sign in to accept this invite</p>
        <SignInForm />
      </div>
    );
  }

  if (householdLoading) {
    return <div className="centered-screen">Loading…</div>;
  }

  if (household) {
    return (
      <div className="auth-screen">
        <h1>Already in a household</h1>
        <p className="subtitle">
          You're already a member of "{household.name}". This app supports one household per
          account, so you'd need to leave that one before joining another.
        </p>
        <button type="button" onClick={() => navigate('/')}>
          Go to your household
        </button>
      </div>
    );
  }

  if (previewLoading) {
    return <div className="centered-screen">Loading…</div>;
  }

  if (previewError || !preview) {
    return (
      <div className="auth-screen">
        <h1>Invite not found</h1>
        <p className="subtitle">{previewError ?? "This invite link isn't valid."}</p>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <h1>Join "{preview.name}"</h1>
      <p className="subtitle">
        {preview.memberCount} member{preview.memberCount === 1 ? '' : 's'} already here.
      </p>
      {joinError && <p className="error">{joinError}</p>}
      <button type="button" onClick={handleJoin} disabled={joining}>
        {joining ? 'Joining…' : `Join ${preview.name}`}
      </button>
    </div>
  );
}

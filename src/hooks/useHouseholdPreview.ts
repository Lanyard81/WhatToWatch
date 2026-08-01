import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface HouseholdPreview {
  name: string;
  memberCount: number;
}

export function useHouseholdPreview(householdId: string | undefined) {
  const [preview, setPreview] = useState<HouseholdPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) {
      setPreview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      doc(db, 'households', householdId),
      (snap) => {
        if (!snap.exists()) {
          setError('This invite link is no longer valid.');
          setPreview(null);
        } else {
          const data = snap.data();
          setPreview({ name: data.name, memberCount: (data.memberIds ?? []).length });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.code === 'permission-denied' ? 'This invite link is no longer valid.' : `Could not load invite (${err.code}).`);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId]);

  return { preview, loading, error };
}

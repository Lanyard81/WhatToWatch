import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Member } from '../types';

export function useMembers(householdId: string | undefined) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'households', householdId, 'members'),
      (snap) => {
        setMembers(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              displayName: data.displayName ?? 'Member',
              joinedAt: data.joinedAt?.toMillis?.() ?? Date.now(),
            } satisfies Member;
          }),
        );
        setLoading(false);
      },
      (err) => {
        console.error('[members] snapshot error:', err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId]);

  return { members, loading };
}

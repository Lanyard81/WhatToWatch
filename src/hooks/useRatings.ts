import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rating } from '../types';

export const SHARED_RATING_DOC_ID = 'shared';

export function useRatings(householdId: string | undefined, titleId: string | undefined) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId || !titleId) {
      setRatings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'households', householdId, 'titles', titleId, 'ratings'),
      (snap) => {
        setRatings(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              memberId: data.memberId ?? null,
              rating: data.rating,
              createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
            } satisfies Rating;
          }),
        );
        setLoading(false);
      },
      (err) => {
        console.error('[ratings] snapshot error:', err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, titleId]);

  return { ratings, loading };
}

export async function setRating(
  householdId: string,
  titleId: string,
  docId: string,
  memberId: string | null,
  rating: number,
) {
  await setDoc(
    doc(db, 'households', householdId, 'titles', titleId, 'ratings', docId),
    { memberId, rating, createdAt: serverTimestamp() },
    { merge: true },
  );
}

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SHARED_RATING_DOC_ID } from './useRatings';
import type { RatingMode } from '../types';

/** Aggregates the primary rating (respecting shared/individual mode) for a set of titles. */
export function useWatchedRatingsMap(
  householdId: string | undefined,
  titleIds: string[],
  ratingMode: RatingMode,
  myUid: string | undefined,
) {
  const [ratingsByTitle, setRatingsByTitle] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!householdId || titleIds.length === 0) {
      setRatingsByTitle({});
      return;
    }

    const unsubscribers = titleIds.map((titleId) =>
      onSnapshot(collection(db, 'households', householdId, 'titles', titleId, 'ratings'), (snap) => {
        const targetId = ratingMode === 'shared' ? SHARED_RATING_DOC_ID : myUid;
        const doc = snap.docs.find((d) => d.id === targetId);
        setRatingsByTitle((prev) => ({ ...prev, [titleId]: doc ? (doc.data().rating as number) : null }));
      }),
    );

    return () => unsubscribers.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, titleIds.join(','), ratingMode, myUid]);

  return ratingsByTitle;
}

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firestoreErrorMessage } from '../lib/errorMessages';
import type { Title, TitleStatus } from '../types';

export function useTitles(householdId: string | undefined, status: TitleStatus) {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) {
      setTitles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const orderField = status === 'watched' ? 'watchedAt' : 'addedAt';
    const q = query(
      collection(db, 'households', householdId, 'titles'),
      where('status', '==', status),
      orderBy(orderField, 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTitles(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              tmdbId: data.tmdbId,
              mediaType: data.mediaType,
              name: data.name,
              summary: data.summary,
              posterPath: data.posterPath,
              genre: data.genre ?? [],
              year: data.year,
              runtimeMinutes: data.runtimeMinutes,
              status: data.status,
              watchedAt: data.watchedAt?.toMillis?.() ?? null,
              addedBy: data.addedBy,
              addedAt: data.addedAt?.toMillis?.() ?? Date.now(),
              tags: data.tags ?? [],
              wouldRewatch: data.wouldRewatch ?? false,
              notes: data.notes ?? '',
              optedOut: data.optedOut ?? [],
            } satisfies Title;
          }),
        );
        setLoading(false);
      },
      (err) => {
        console.error('[titles] snapshot error:', err);
        setError(firestoreErrorMessage(err.code));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, status]);

  return { titles, loading, error };
}

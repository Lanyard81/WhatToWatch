import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Title } from '../types';

export function useTitle(householdId: string | undefined, titleId: string | undefined) {
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId || !titleId) {
      setTitle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      doc(db, 'households', householdId, 'titles', titleId),
      (snap) => {
        if (!snap.exists()) {
          setTitle(null);
        } else {
          const data = snap.data();
          setTitle({
            id: snap.id,
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
          } satisfies Title);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[title] snapshot error:', err);
        setError(err.code === 'permission-denied' ? 'Firestore rejected this request.' : `Could not load title (${err.code}).`);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, titleId]);

  return { title, loading, error };
}

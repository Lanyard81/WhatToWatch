import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { TitleStatus } from '../types';

export function useExistingTmdbIds(householdId: string | undefined) {
  const [existing, setExisting] = useState<Map<number, TitleStatus>>(new Map());

  useEffect(() => {
    if (!householdId) {
      setExisting(new Map());
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'households', householdId, 'titles'), (snap) => {
      const map = new Map<number, TitleStatus>();
      snap.docs.forEach((d) => {
        const data = d.data();
        map.set(data.tmdbId, data.status);
      });
      setExisting(map);
    });

    return unsubscribe;
  }, [householdId]);

  return existing;
}

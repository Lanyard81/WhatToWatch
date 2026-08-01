import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

function slugify(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function useHouseholdTags(householdId: string | undefined) {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!householdId) {
      setTags([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'households', householdId, 'tags'), (snap) => {
      setTags(snap.docs.map((d) => d.data().label as string).sort());
    });

    return unsubscribe;
  }, [householdId]);

  return tags;
}

export async function upsertHouseholdTag(householdId: string, label: string) {
  const trimmed = label.trim();
  const id = slugify(trimmed);
  if (!id) return;
  await setDoc(doc(db, 'households', householdId, 'tags', id), { label: trimmed }, { merge: true });
}

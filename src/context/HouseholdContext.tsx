import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { firestoreErrorMessage } from '../lib/errorMessages';
import type { Household, RatingMode } from '../types';

interface HouseholdContextValue {
  household: Household | null;
  loading: boolean;
  error: string | null;
  createHousehold: (name: string) => Promise<void>;
  addMemberByUid: (uid: string) => Promise<void>;
  updateRatingMode: (mode: RatingMode) => Promise<void>;
  joinHousehold: (householdId: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHousehold(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(collection(db, 'households'), where('memberIds', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setHousehold(null);
        } else {
          const d = snap.docs[0];
          const data = d.data();
          setHousehold({
            id: d.id,
            name: data.name,
            ratingMode: data.ratingMode,
            createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
            memberIds: data.memberIds ?? [],
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('[household] snapshot error:', err);
        setError(firestoreErrorMessage(err.code));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  // Someone added to memberIds by another member has no /members doc yet
  // (that write requires the invitee's own uid). Create it once discovered.
  useEffect(() => {
    if (!user || !household) return;
    const memberRef = doc(db, 'households', household.id, 'members', user.uid);
    getDoc(memberRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(memberRef, {
          displayName: user.displayName ?? user.email ?? 'Member',
          joinedAt: serverTimestamp(),
        });
      }
    });
  }, [user, household]);

  async function createHousehold(name: string) {
    if (!user) throw new Error('Not signed in');
    const ref = doc(collection(db, 'households'));
    await setDoc(ref, {
      name,
      ratingMode: 'shared',
      createdAt: serverTimestamp(),
      memberIds: [user.uid],
    });
    await setDoc(doc(db, 'households', ref.id, 'members', user.uid), {
      displayName: user.displayName ?? user.email ?? 'Member',
      joinedAt: serverTimestamp(),
    });
  }

  async function addMemberByUid(uid: string) {
    if (!household) throw new Error('No household');
    await updateDoc(doc(db, 'households', household.id), {
      memberIds: arrayUnion(uid),
    });
  }

  async function updateRatingMode(mode: RatingMode) {
    if (!household) throw new Error('No household');
    await updateDoc(doc(db, 'households', household.id), { ratingMode: mode });
  }

  async function joinHousehold(householdId: string) {
    if (!user) throw new Error('Not signed in');
    await updateDoc(doc(db, 'households', householdId), {
      memberIds: arrayUnion(user.uid),
    });
  }

  async function leaveHousehold() {
    if (!user || !household) throw new Error('No household to leave');
    // Delete the member doc first, while still a member — deleting it after
    // being removed from memberIds would fail the household-membership check.
    await deleteDoc(doc(db, 'households', household.id, 'members', user.uid));
    await updateDoc(doc(db, 'households', household.id), {
      memberIds: arrayRemove(user.uid),
    });
  }

  return (
    <HouseholdContext.Provider
      value={{
        household,
        loading,
        error,
        createHousehold,
        addMemberByUid,
        updateRatingMode,
        joinHousehold,
        leaveHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}

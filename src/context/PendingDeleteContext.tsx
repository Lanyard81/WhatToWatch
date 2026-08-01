import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const UNDO_WINDOW_MS = 5000;

interface PendingDeleteContextValue {
  pendingIds: Set<string>;
  requestDelete: (householdId: string, titleId: string, titleName: string) => void;
}

const PendingDeleteContext = createContext<PendingDeleteContextValue | undefined>(undefined);

interface ToastState {
  titleId: string;
  titleName: string;
}

export function PendingDeleteProvider({ children }: { children: ReactNode }) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const requestDelete = useCallback((householdId: string, titleId: string, titleName: string) => {
    setPendingIds((prev) => new Set(prev).add(titleId));
    setToast({ titleId, titleName });

    const timer = setTimeout(async () => {
      timers.current.delete(titleId);
      await deleteDoc(doc(db, 'households', householdId, 'titles', titleId));
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(titleId);
        return next;
      });
      setToast((current) => (current?.titleId === titleId ? null : current));
    }, UNDO_WINDOW_MS);

    timers.current.set(titleId, timer);
  }, []);

  function undo(titleId: string) {
    const timer = timers.current.get(titleId);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(titleId);
    }
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(titleId);
      return next;
    });
    setToast(null);
  }

  return (
    <PendingDeleteContext.Provider value={{ pendingIds, requestDelete }}>
      {children}
      {toast && (
        <div className="toast">
          <span>Deleted "{toast.titleName}"</span>
          <button type="button" className="secondary" onClick={() => undo(toast.titleId)}>
            Undo
          </button>
        </div>
      )}
    </PendingDeleteContext.Provider>
  );
}

export function usePendingDelete() {
  const ctx = useContext(PendingDeleteContext);
  if (!ctx) throw new Error('usePendingDelete must be used within PendingDeleteProvider');
  return ctx;
}

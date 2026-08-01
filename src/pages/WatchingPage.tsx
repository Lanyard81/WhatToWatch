import { useMemo, useState } from 'react';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useHousehold } from '../context/HouseholdContext';
import { usePendingDelete } from '../context/PendingDeleteContext';
import { useTitles } from '../hooks/useTitles';
import { TitleCard } from '../components/TitleCard';
import type { Title } from '../types';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function WatchingPage() {
  const { household } = useHousehold();
  const { titles, loading, error } = useTitles(household?.id, 'watching');
  const { pendingIds } = usePendingDelete();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [watchedDate, setWatchedDate] = useState(todayInputValue());

  const visibleTitles = useMemo(() => titles.filter((t) => !pendingIds.has(t.id)), [titles, pendingIds]);

  function startMarking(title: Title) {
    setMarkingId(title.id);
    setWatchedDate(todayInputValue());
  }

  async function confirmWatched() {
    if (!household || !markingId) return;
    const watchedAtMillis = new Date(`${watchedDate}T12:00:00`).getTime();
    await updateDoc(doc(db, 'households', household.id, 'titles', markingId), {
      status: 'watched',
      watchedAt: Timestamp.fromMillis(watchedAtMillis),
    });
    setMarkingId(null);
  }

  async function backToWantToWatch(title: Title) {
    if (!household) return;
    await updateDoc(doc(db, 'households', household.id, 'titles', title.id), {
      status: 'want_to_watch',
    });
  }

  return (
    <div className="page">
      <h1>Watching</h1>

      {error && <p className="error">{error}</p>}

      {!loading && !error && visibleTitles.length === 0 && (
        <p className="empty-state">Nothing in progress — mark a title as "Start watching" from your Want to Watch list.</p>
      )}

      <ul className="title-list">
        {visibleTitles.map((title) => (
          <li key={title.id}>
            <TitleCard
              title={title}
              action={
                markingId === title.id ? (
                  <div className="watched-confirm">
                    <input
                      type="date"
                      value={watchedDate}
                      onChange={(e) => setWatchedDate(e.target.value)}
                    />
                    <button type="button" onClick={confirmWatched}>
                      Confirm
                    </button>
                    <button type="button" className="secondary" onClick={() => setMarkingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="action-stack">
                    <button type="button" onClick={() => startMarking(title)}>
                      Mark watched
                    </button>
                    <button type="button" className="secondary" onClick={() => backToWantToWatch(title)}>
                      Back to Want to Watch
                    </button>
                  </div>
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useState } from 'react';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useHousehold } from '../context/HouseholdContext';
import { useTitles } from '../hooks/useTitles';
import { TitleCard } from '../components/TitleCard';
import type { Title } from '../types';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function WantToWatchPage() {
  const { household } = useHousehold();
  const { titles, loading, error } = useTitles(household?.id, 'want_to_watch');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [watchedDate, setWatchedDate] = useState(todayInputValue());

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

  return (
    <div className="page">
      <h1>Want to Watch</h1>

      {error && <p className="error">{error}</p>}

      {!loading && !error && titles.length === 0 && (
        <p className="empty-state">Nothing on your list yet — search to add something.</p>
      )}

      <ul className="title-list">
        {titles.map((title) => (
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
                  <button type="button" onClick={() => startMarking(title)}>
                    Mark watched
                  </button>
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

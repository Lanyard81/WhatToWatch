import { useMemo, useState } from 'react';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useHousehold } from '../context/HouseholdContext';
import { usePendingDelete } from '../context/PendingDeleteContext';
import { useTitles } from '../hooks/useTitles';
import { useViewMode } from '../hooks/useViewMode';
import { TitleCard } from '../components/TitleCard';
import { PosterCarousel } from '../components/PosterCarousel';
import { PosterShelf } from '../components/PosterShelf';
import { PageHeader } from '../components/PageHeader';
import { SkeletonList } from '../components/Skeleton';
import { icons } from '../components/icons';
import type { Title } from '../types';

type SortMode = 'added' | 'alpha' | 'runtime';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function WatchingPage() {
  const { household } = useHousehold();
  const { titles, loading, error } = useTitles(household?.id, 'watching');
  const { pendingIds } = usePendingDelete();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [watchedDate, setWatchedDate] = useState(todayInputValue());
  const [viewMode, setViewMode] = useViewMode('watching', 'carousel');
  const [celebration, setCelebration] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('added');

  const visibleTitles = useMemo(() => {
    const list = titles.filter((t) => !pendingIds.has(t.id));
    if (sortMode === 'alpha') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'runtime') return [...list].sort((a, b) => (a.runtimeMinutes ?? 999) - (b.runtimeMinutes ?? 999));
    return list;
  }, [titles, pendingIds, sortMode]);

  function startMarking(title: Title) {
    setMarkingId(title.id);
    setWatchedDate(todayInputValue());
  }

  async function confirmWatched(title: Title) {
    if (!household) return;
    const watchedAtMillis = new Date(`${watchedDate}T12:00:00`).getTime();
    await updateDoc(doc(db, 'households', household.id, 'titles', title.id), {
      status: 'watched',
      watchedAt: Timestamp.fromMillis(watchedAtMillis),
    });
    setMarkingId(null);
    setCelebration(`🎬 "${title.name}" marked as watched`);
    setTimeout(() => setCelebration(null), 2500);
  }

  async function backToWantToWatch(title: Title) {
    if (!household) return;
    await updateDoc(doc(db, 'households', household.id, 'titles', title.id), {
      status: 'want_to_watch',
    });
  }

  return (
    <div className="page">
      <PageHeader subtitle="In progress right now" />

      {error && <p className="error">{error}</p>}

      {loading && <SkeletonList count={2} />}

      {!loading && !error && visibleTitles.length === 0 && (
        <div className="empty-state-card">
          <span className="empty-state-icon" aria-hidden="true">📺</span>
          <p>Nothing in progress. Mark something "Start watching" from Want to Watch.</p>
        </div>
      )}

      {visibleTitles.length > 0 && (
        <div className="view-toggle" role="group" aria-label="View style">
          <button
            type="button"
            aria-label="Posters view"
            className={viewMode === 'carousel' ? 'active' : ''}
            onClick={() => setViewMode('carousel')}
          >
            {icons.posters}
          </button>
          <button
            type="button"
            aria-label="List view"
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            {icons.list}
          </button>
          <button
            type="button"
            aria-label="Shelf view"
            className={viewMode === 'shelf' ? 'active' : ''}
            onClick={() => setViewMode('shelf')}
          >
            {icons.grid}
          </button>
        </div>
      )}

      {visibleTitles.length > 0 && (
        <div className="filter-bar">
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            <option value="added">Sort: Recently added</option>
            <option value="alpha">Sort: A–Z</option>
            <option value="runtime">Sort: Shortest first</option>
          </select>
        </div>
      )}

      {viewMode === 'carousel' && visibleTitles.length > 0 ? (
        <PosterCarousel titles={visibleTitles} />
      ) : viewMode === 'shelf' && visibleTitles.length > 0 ? (
        <PosterShelf titles={visibleTitles} />
      ) : (
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
                      <button type="button" onClick={() => confirmWatched(title)}>
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
      )}

      {celebration && (
        <div className="toast toast-positive">
          <span className="toast-message">{celebration}</span>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useHousehold } from '../context/HouseholdContext';
import { usePendingDelete } from '../context/PendingDeleteContext';
import { useTitles } from '../hooks/useTitles';
import { useViewMode } from '../hooks/useViewMode';
import { TitleCard } from '../components/TitleCard';
import { PosterCarousel } from '../components/PosterCarousel';
import { PageHeader } from '../components/PageHeader';
import { SkeletonList } from '../components/Skeleton';
import type { Title } from '../types';

type SortMode = 'added' | 'alpha' | 'runtime';
type RuntimeCap = 'any' | '30' | '60' | '120';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function WantToWatchPage() {
  const navigate = useNavigate();
  const { household } = useHousehold();
  const { titles, loading, error } = useTitles(household?.id, 'want_to_watch');
  const { pendingIds } = usePendingDelete();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [watchedDate, setWatchedDate] = useState(todayInputValue());
  const [sortMode, setSortMode] = useState<SortMode>('added');
  const [viewMode, setViewMode] = useViewMode('want_to_watch', 'carousel');
  const [celebration, setCelebration] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [runtimeCap, setRuntimeCap] = useState<RuntimeCap>('any');
  const [pickedTitle, setPickedTitle] = useState<Title | null>(null);
  const [pickMessage, setPickMessage] = useState<string | null>(null);

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

  async function startWatching(title: Title) {
    if (!household) return;
    await updateDoc(doc(db, 'households', household.id, 'titles', title.id), {
      status: 'watching',
    });
  }

  function pickRandom() {
    const cap = runtimeCap === 'any' ? Infinity : Number(runtimeCap);
    const pool = visibleTitles.filter((t) => (runtimeCap === 'any' ? true : (t.runtimeMinutes ?? Infinity) <= cap));
    if (pool.length === 0) {
      setPickedTitle(null);
      setPickMessage('Nothing on your list fits that runtime.');
      return;
    }
    setPickMessage(null);
    setPickedTitle(pool[Math.floor(Math.random() * pool.length)]);
  }

  return (
    <div className="page">
      <PageHeader title="Want to Watch" />

      <div className="picker-block">
        <button type="button" className="secondary" onClick={() => setPickerOpen((v) => !v)}>
          🎲 What should we watch tonight?
        </button>
        {pickerOpen && (
          <div className="picker-panel">
            <select value={runtimeCap} onChange={(e) => setRuntimeCap(e.target.value as RuntimeCap)}>
              <option value="any">Any runtime</option>
              <option value="30">Under 30 min</option>
              <option value="60">Under 1 hour</option>
              <option value="120">Under 2 hours</option>
            </select>
            <button type="button" onClick={pickRandom}>
              {pickedTitle ? 'Pick again' : 'Pick for me'}
            </button>
            {pickMessage && <p className="hint">{pickMessage}</p>}
            {pickedTitle && <TitleCard title={pickedTitle} />}
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {loading && <SkeletonList count={3} />}

      {!loading && !error && visibleTitles.length === 0 && (
        <div className="empty-state-card">
          <span className="empty-state-icon" aria-hidden="true">🍿</span>
          <p>Nothing on your list yet.</p>
          <button type="button" onClick={() => navigate('/search')}>
            Search for something
          </button>
        </div>
      )}

      {visibleTitles.length > 0 && (
        <div className="view-toggle" role="group" aria-label="View style">
          <button
            type="button"
            className={viewMode === 'carousel' ? 'active' : ''}
            onClick={() => setViewMode('carousel')}
          >
            ▭▭ Posters
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            ☰ List
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

      {viewMode === 'carousel' ? (
        <PosterCarousel titles={visibleTitles} />
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
                      <button type="button" className="secondary" onClick={() => startWatching(title)}>
                        Start watching
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

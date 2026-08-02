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
import { PosterShelf } from '../components/PosterShelf';
import { SkeletonList } from '../components/Skeleton';
import { icons } from '../components/icons';
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [listQuery, setListQuery] = useState('');

  function closeListSearch() {
    setSearchOpen(false);
    setListQuery('');
  }

  const visibleTitles = useMemo(() => {
    let list = titles.filter((t) => !pendingIds.has(t.id));
    if (listQuery.trim()) {
      const q = listQuery.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (sortMode === 'alpha') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'runtime') return [...list].sort((a, b) => (a.runtimeMinutes ?? 999) - (b.runtimeMinutes ?? 999));
    return list;
  }, [titles, pendingIds, sortMode, listQuery]);

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
      <div className="controls-row">
        {!searchOpen && (
          <>
            <button
              type="button"
              className="icon-button"
              aria-label="What should we watch tonight?"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((v) => !v)}
            >
              {icons.dice}
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Search your list"
              onClick={() => setSearchOpen(true)}
            >
              {icons.search}
            </button>
            {visibleTitles.length > 0 && (
              <>
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
                <div className="icon-select">
                  <span className="icon-select-icon" aria-hidden="true">
                    {icons.sort}
                  </span>
                  <select
                    aria-label="Sort"
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                  >
                    <option value="added">Recently added</option>
                    <option value="alpha">A–Z</option>
                    <option value="runtime">Shortest first</option>
                  </select>
                </div>
              </>
            )}
          </>
        )}
        {searchOpen && (
          <div className="quick-search-expanded">
            <span className="quick-search-icon" aria-hidden="true">
              {icons.search}
            </span>
            <input
              type="search"
              autoFocus
              placeholder="Search your list…"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
            />
            <button type="button" className="icon-button" aria-label="Close search" onClick={closeListSearch}>
              {icons.close}
            </button>
          </div>
        )}
      </div>

      {pickerOpen && (
        <div className="picker-block">
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
        </div>
      )}

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

      {viewMode === 'carousel' ? (
        <PosterCarousel titles={visibleTitles} />
      ) : viewMode === 'shelf' ? (
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

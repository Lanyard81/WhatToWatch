import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { usePendingDelete } from '../context/PendingDeleteContext';
import { useTitles } from '../hooks/useTitles';
import { useViewMode } from '../hooks/useViewMode';
import { useDefaultViewMode } from '../hooks/useDefaultViewMode';
import { TitleCard } from '../components/TitleCard';
import { PosterCarousel } from '../components/PosterCarousel';
import { PosterShelf } from '../components/PosterShelf';
import { SkeletonList } from '../components/Skeleton';
import { icons } from '../components/icons';
import type { Title } from '../types';

type SortMode = 'added' | 'alpha' | 'runtime' | 'mypicks';
type MediaFilter = 'any' | 'movie' | 'tv';
type PickScope = 'everyone' | 'justme';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function WantToWatchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { titles, loading, error } = useTitles(household?.id, 'want_to_watch');
  const { pendingIds } = usePendingDelete();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [watchedDate, setWatchedDate] = useState(todayInputValue());
  const [sortMode, setSortMode] = useState<SortMode>('added');
  const [defaultViewMode] = useDefaultViewMode();
  const [viewMode, setViewMode] = useViewMode('want_to_watch', defaultViewMode);
  const [celebration, setCelebration] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('any');
  const [pickScope, setPickScope] = useState<PickScope>('everyone');
  const [pickedTitle, setPickedTitle] = useState<Title | null>(null);
  const [pickMessage, setPickMessage] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [listQuery, setListQuery] = useState('');

  function closeListSearch() {
    setSearchOpen(false);
    setListQuery('');
  }

  function passedByMe(title: Title) {
    return !!user && title.optedOut.includes(user.uid);
  }

  const visibleTitles = useMemo(() => {
    let list = titles.filter((t) => !pendingIds.has(t.id));
    if (listQuery.trim()) {
      const q = listQuery.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    // "My picks" is a filter, not a reorder — everything left has already
    // passed the "not opted out by me" check, so nothing's left to sink.
    if (sortMode === 'mypicks') {
      list = list.filter((t) => !passedByMe(t));
    }

    function bySortMode(a: Title, b: Title) {
      if (sortMode === 'alpha') return a.name.localeCompare(b.name);
      if (sortMode === 'runtime') return (a.runtimeMinutes ?? 999) - (b.runtimeMinutes ?? 999);
      return 0;
    }

    // Titles I've passed on always sink to the end, regardless of sort mode.
    return [...list].sort((a, b) => {
      const aOut = passedByMe(a) ? 1 : 0;
      const bOut = passedByMe(b) ? 1 : 0;
      if (aOut !== bOut) return aOut - bOut;
      return bySortMode(a, b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titles, pendingIds, sortMode, listQuery, user?.uid]);

  const passedIds = useMemo(
    () => new Set(visibleTitles.filter(passedByMe).map((t) => t.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleTitles, user?.uid],
  );

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
    const pool = visibleTitles.filter((t) => {
      if (mediaFilter !== 'any' && t.mediaType !== mediaFilter) return false;
      if (pickScope === 'everyone') return t.optedOut.length === 0;
      return !passedByMe(t);
    });
    if (pool.length === 0) {
      setPickedTitle(null);
      setPickMessage('Nothing on your list matches that.');
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
                    <option value="mypicks">My picks</option>
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
            <select value={mediaFilter} onChange={(e) => setMediaFilter(e.target.value as MediaFilter)}>
              <option value="any">Movies or TV</option>
              <option value="movie">Movies only</option>
              <option value="tv">TV only</option>
            </select>
            <select value={pickScope} onChange={(e) => setPickScope(e.target.value as PickScope)}>
              <option value="everyone">Everyone's picks</option>
              <option value="justme">Just mine</option>
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
        <PosterCarousel titles={visibleTitles} dimmedIds={passedIds} />
      ) : viewMode === 'shelf' ? (
        <PosterShelf titles={visibleTitles} dimmedIds={passedIds} />
      ) : (
        <ul className="title-list">
          {visibleTitles.map((title) => (
            <li key={title.id} className={passedIds.has(title.id) ? 'dimmed' : ''}>
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

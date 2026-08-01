import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { usePendingDelete } from '../context/PendingDeleteContext';
import { useTitles } from '../hooks/useTitles';
import { useViewMode } from '../hooks/useViewMode';
import { useRatings, SHARED_RATING_DOC_ID } from '../hooks/useRatings';
import { TitleCard } from '../components/TitleCard';
import { PosterCarousel } from '../components/PosterCarousel';
import { PageHeader } from '../components/PageHeader';
import { SkeletonList } from '../components/Skeleton';
import type { Title } from '../types';

type SortMode = 'date' | 'rating';

export function WatchedPage() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const { titles: rawTitles, loading, error } = useTitles(household?.id, 'watched');
  const { pendingIds } = usePendingDelete();

  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [tagFilter, setTagFilter] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [ratingsByTitle, setRatingsByTitle] = useState<Record<string, number | null>>({});
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useViewMode('watched', 'list');

  const titles = useMemo(() => rawTitles.filter((t) => !pendingIds.has(t.id)), [rawTitles, pendingIds]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    titles.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [titles]);

  function reportRating(titleId: string, rating: number | null) {
    setRatingsByTitle((prev) => (prev[titleId] === rating ? prev : { ...prev, [titleId]: rating }));
  }

  const displayedTitles = useMemo(() => {
    let list = titles;
    if (tagFilter) list = list.filter((t) => t.tags.includes(tagFilter));
    if (minRating > 0) list = list.filter((t) => (ratingsByTitle[t.id] ?? 0) >= minRating);

    if (sortMode === 'rating') {
      list = [...list].sort((a, b) => (ratingsByTitle[b.id] ?? -1) - (ratingsByTitle[a.id] ?? -1));
    }
    return list;
  }, [titles, tagFilter, minRating, sortMode, ratingsByTitle]);

  async function exportAsText() {
    const lines = displayedTitles.map((t) => {
      const rating = ratingsByTitle[t.id];
      const parts = [t.name, t.year ? `(${t.year})` : null, rating != null ? `${rating}/10` : null];
      return parts.filter(Boolean).join(' ');
    });
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page">
      <PageHeader title="Watched" subtitle={titles.length ? `${titles.length} title${titles.length === 1 ? '' : 's'}` : undefined} />

      {error && <p className="error">{error}</p>}

      {loading && <SkeletonList count={4} />}

      {!loading && !error && titles.length === 0 && (
        <div className="empty-state-card">
          <span className="empty-state-icon" aria-hidden="true">✅</span>
          <p>Nothing marked as watched yet — it'll show up here once you finish something.</p>
        </div>
      )}

      {titles.length > 0 && (
        <div className="view-toggle" role="group" aria-label="View style">
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            ☰ List
          </button>
          <button
            type="button"
            className={viewMode === 'carousel' ? 'active' : ''}
            onClick={() => setViewMode('carousel')}
          >
            ▭▭ Posters
          </button>
        </div>
      )}

      {titles.length > 0 && (
        <div className="filter-bar">
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            <option value="date">Sort: Date watched</option>
            <option value="rating">Sort: Rating</option>
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>Any rating</option>
            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}+ rating
              </option>
            ))}
          </select>
          <button type="button" className="secondary" onClick={exportAsText}>
            {copied ? 'Copied!' : 'Copy as text'}
          </button>
        </div>
      )}

      {viewMode === 'carousel' ? (
        <PosterCarousel titles={displayedTitles} />
      ) : (
        <ul className="title-list">
          {displayedTitles.map((title) => (
            <li key={title.id}>
              <WatchedRow
                title={title}
                householdId={household?.id}
                ratingMode={household?.ratingMode ?? 'shared'}
                myUid={user?.uid}
                onRating={reportRating}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WatchedRow({
  title,
  householdId,
  ratingMode,
  myUid,
  onRating,
}: {
  title: Title;
  householdId: string | undefined;
  ratingMode: 'shared' | 'individual';
  myUid: string | undefined;
  onRating: (titleId: string, rating: number | null) => void;
}) {
  const { ratings } = useRatings(householdId, title.id);

  const primaryRating =
    ratingMode === 'shared'
      ? ratings.find((r) => r.id === SHARED_RATING_DOC_ID)?.rating ?? null
      : ratings.find((r) => r.id === myUid)?.rating ?? null;

  useEffect(() => {
    onRating(title.id, primaryRating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title.id, primaryRating]);

  return (
    <TitleCard
      title={title}
      footer={
        <p className="title-card-meta">
          {primaryRating !== null ? `★ ${primaryRating}/10` : 'Not rated'}
          {title.wouldRewatch ? ' · Would rewatch' : ''}
          {title.tags.length ? ` · ${title.tags.join(', ')}` : ''}
        </p>
      }
    />
  );
}

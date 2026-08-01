import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useTitles } from '../hooks/useTitles';
import { useRatings, SHARED_RATING_DOC_ID } from '../hooks/useRatings';
import { TitleCard } from '../components/TitleCard';
import type { Title } from '../types';

type SortMode = 'date' | 'rating';

export function WatchedPage() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const { titles, loading, error } = useTitles(household?.id, 'watched');

  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [tagFilter, setTagFilter] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [ratingsByTitle, setRatingsByTitle] = useState<Record<string, number | null>>({});

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

  return (
    <div className="page">
      <h1>Watched</h1>

      {error && <p className="error">{error}</p>}

      {!loading && !error && titles.length === 0 && (
        <p className="empty-state">Nothing marked as watched yet.</p>
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
        </div>
      )}

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

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useTitles } from '../hooks/useTitles';
import { useWatchedRatingsMap } from '../hooks/useWatchedRatingsMap';

export function StatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { titles } = useTitles(household?.id, 'watched');
  const ratingsByTitle = useWatchedRatingsMap(
    household?.id,
    titles.map((t) => t.id),
    household?.ratingMode ?? 'shared',
    user?.uid,
  );

  const stats = useMemo(() => {
    const total = titles.length;

    const genreCounts = new Map<string, number>();
    titles.forEach((t) => t.genre.forEach((g) => genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)));
    let topGenre: string | null = null;
    let topGenreCount = 0;
    genreCounts.forEach((count, genre) => {
      if (count > topGenreCount) {
        topGenre = genre;
        topGenreCount = count;
      }
    });

    const ratedValues = Object.values(ratingsByTitle).filter((r): r is number => r != null);
    const avgRating = ratedValues.length ? ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length : null;

    const thisYear = new Date().getFullYear();
    const watchedThisYear = titles.filter((t) => t.watchedAt && new Date(t.watchedAt).getFullYear() === thisYear).length;

    const rewatchCount = titles.filter((t) => t.wouldRewatch).length;

    const movieCount = titles.filter((t) => t.mediaType === 'movie').length;
    const tvCount = titles.filter((t) => t.mediaType === 'tv').length;

    return { total, topGenre, topGenreCount, avgRating, watchedThisYear, rewatchCount, movieCount, tvCount };
  }, [titles, ratingsByTitle]);

  return (
    <div className="page">
      <button type="button" className="secondary back-button" onClick={() => navigate('/settings')}>
        ← Back
      </button>
      <h1>Stats</h1>

      {stats.total === 0 ? (
        <p className="empty-state">Watch something and mark it watched to see stats here.</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-tile">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total watched</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.watchedThisYear}</span>
            <span className="stat-label">Watched this year</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.avgRating != null ? stats.avgRating.toFixed(1) : '—'}</span>
            <span className="stat-label">Average rating</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.topGenre ?? '—'}</span>
            <span className="stat-label">Top genre{stats.topGenre ? ` (${stats.topGenreCount})` : ''}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.movieCount} / {stats.tvCount}</span>
            <span className="stat-label">Movies / TV</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.rewatchCount}</span>
            <span className="stat-label">Would rewatch</span>
          </div>
        </div>
      )}
    </div>
  );
}

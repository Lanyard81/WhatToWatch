import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { searchTitles, fetchTitleDetails, TMDB_POSTER_BASE } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useExistingTmdbIds } from '../hooks/useExistingTmdbIds';
import type { MediaType, TmdbSearchResult } from '../types';

const DEBOUNCE_MS = 300;

const STATUS_LABEL: Record<string, string> = {
  want_to_watch: 'On your list',
  watching: 'Currently watching',
  watched: 'Already watched',
};

export function SearchPage() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const existingTmdbIds = useExistingTmdbIds(household?.id);
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const r = await searchTitles(query, controller.signal);
        setResults(r);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = useMemo(
    () => (mediaFilter === 'all' ? results : results.filter((r) => r.mediaType === mediaFilter)),
    [results, mediaFilter],
  );

  async function handleAdd(result: TmdbSearchResult) {
    if (!household || !user) return;
    setAddingId(result.tmdbId);
    try {
      const details = await fetchTitleDetails(result.tmdbId, result.mediaType);
      await addDoc(collection(db, 'households', household.id, 'titles'), {
        tmdbId: result.tmdbId,
        mediaType: result.mediaType,
        name: result.name,
        summary: result.summary,
        posterPath: result.posterPath,
        genre: details.genre,
        year: result.year,
        runtimeMinutes: details.runtimeMinutes,
        status: 'want_to_watch',
        watchedAt: null,
        addedBy: user.uid,
        addedAt: serverTimestamp(),
        tags: [],
        wouldRewatch: false,
        notes: '',
      });
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="page">
      <h1>Add a title</h1>
      <div className="search-input-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search movies and TV shows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button type="button" className="secondary clear-button" onClick={() => setQuery('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      <div className="filter-bar">
        {(['all', 'movie', 'tv'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={mediaFilter === f ? '' : 'secondary'}
            onClick={() => setMediaFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV'}
          </button>
        ))}
      </div>

      {searching && <p className="hint">Searching…</p>}
      {!searching && query.trim() && filteredResults.length === 0 && (
        <p className="hint">No results for "{query}".</p>
      )}

      <ul className="search-results">
        {filteredResults.map((r) => {
          const existingStatus = existingTmdbIds.get(r.tmdbId);
          const isAdding = addingId === r.tmdbId;
          return (
            <li key={`${r.mediaType}-${r.tmdbId}`} className="search-result">
              <div className="search-result-poster">
                {r.posterPath ? (
                  <img src={`${TMDB_POSTER_BASE}${r.posterPath}`} alt="" loading="lazy" />
                ) : (
                  <div className="poster-placeholder" aria-hidden="true" />
                )}
              </div>
              <div className="search-result-body">
                <span className={`badge badge-${r.mediaType}`}>
                  {r.mediaType === 'movie' ? 'Movie' : 'TV'}
                </span>
                <p className="search-result-title">
                  {r.name} {r.year ? <span className="hint">({r.year})</span> : null}
                </p>
                {existingStatus && <p className="hint">{STATUS_LABEL[existingStatus] ?? 'Already added'}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleAdd(r)}
                disabled={isAdding || !!existingStatus}
                className="add-button"
              >
                {existingStatus ? 'Added' : isAdding ? 'Adding…' : 'Add'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

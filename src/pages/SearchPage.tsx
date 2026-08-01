import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { searchTitles, fetchTitleDetails, TMDB_POSTER_BASE } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import type { TmdbSearchResult } from '../types';

const DEBOUNCE_MS = 300;

export function SearchPage() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
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
      });
      setAddedIds((prev) => new Set(prev).add(result.tmdbId));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="page">
      <h1>Add a title</h1>
      <input
        type="search"
        className="search-input"
        placeholder="Search movies and TV shows…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {searching && <p className="hint">Searching…</p>}
      {!searching && query.trim() && results.length === 0 && (
        <p className="hint">No results for "{query}".</p>
      )}

      <ul className="search-results">
        {results.map((r) => {
          const isAdded = addedIds.has(r.tmdbId);
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
              </div>
              <button
                type="button"
                onClick={() => handleAdd(r)}
                disabled={isAdding || isAdded}
                className="add-button"
              >
                {isAdded ? 'Added' : isAdding ? 'Adding…' : 'Add'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

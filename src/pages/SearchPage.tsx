import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  searchTitles,
  fetchTitleDetails,
  searchPeople,
  personCredits,
  TMDB_POSTER_BASE,
  type TmdbPerson,
} from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useExistingTmdbIds } from '../hooks/useExistingTmdbIds';
import type { MediaType, TmdbSearchResult } from '../types';

const DEBOUNCE_MS = 300;
type SearchMode = 'title' | 'actor';

const STATUS_LABEL: Record<string, string> = {
  want_to_watch: 'On your list',
  watching: 'Currently watching',
  watched: 'Already watched',
};

export function SearchPage() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const existingTmdbIds = useExistingTmdbIds(household?.id);
  const [mode, setMode] = useState<SearchMode>('title');
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [people, setPeople] = useState<TmdbPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<TmdbPerson | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  function switchMode(next: SearchMode) {
    setMode(next);
    setQuery('');
    setResults([]);
    setPeople([]);
    setSelectedPerson(null);
  }

  // Title search (debounced).
  useEffect(() => {
    if (mode !== 'title') return;
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
  }, [query, mode]);

  // Actor search (debounced) — only while no person is selected yet.
  useEffect(() => {
    if (mode !== 'actor' || selectedPerson) return;
    if (!query.trim()) {
      setPeople([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const r = await searchPeople(query, controller.signal);
        setPeople(r);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setPeople([]);
        }
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, mode, selectedPerson]);

  async function selectPerson(person: TmdbPerson) {
    setSelectedPerson(person);
    setCreditsLoading(true);
    try {
      const credits = await personCredits(person.id);
      setResults(credits);
    } finally {
      setCreditsLoading(false);
    }
  }

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

  const showingPersonPicker = mode === 'actor' && !selectedPerson;

  return (
    <div className="page">
      <div className="filter-bar">
        <button type="button" className={mode === 'title' ? '' : 'secondary'} onClick={() => switchMode('title')}>
          Titles
        </button>
        <button type="button" className={mode === 'actor' ? '' : 'secondary'} onClick={() => switchMode('actor')}>
          Actor
        </button>
      </div>

      {mode === 'actor' && selectedPerson && (
        <div className="selected-person-row">
          <span>
            Showing credits for <strong>{selectedPerson.name}</strong>
          </span>
          <button type="button" className="secondary" onClick={() => { setSelectedPerson(null); setResults([]); }}>
            Change actor
          </button>
        </div>
      )}

      {!(mode === 'actor' && selectedPerson) && (
        <div className="search-input-row">
          <input
            type="search"
            className="search-input"
            placeholder={mode === 'title' ? 'Search movies and TV shows…' : 'Search for an actor…'}
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
      )}

      {showingPersonPicker ? (
        <>
          {searching && <p className="hint">Searching…</p>}
          {!searching && query.trim() && people.length === 0 && <p className="hint">No actors found for "{query}".</p>}
          <ul className="search-results">
            {people.map((p) => (
              <li key={p.id} className="search-result" onClick={() => selectPerson(p)} role="button" tabIndex={0}>
                <div className="search-result-poster">
                  {p.profilePath ? (
                    <img src={`${TMDB_POSTER_BASE}${p.profilePath}`} alt="" loading="lazy" />
                  ) : (
                    <div className="poster-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="search-result-body">
                  <p className="search-result-title">{p.name}</p>
                  {p.knownFor && <p className="hint">{p.knownFor}</p>}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
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

          {(mode === 'title' ? searching : creditsLoading) && <p className="hint">Searching…</p>}
          {mode === 'title' && !searching && query.trim() && filteredResults.length === 0 && (
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
        </>
      )}
    </div>
  );
}

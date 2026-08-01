import type { MediaType, TmdbSearchResult } from '../types';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

interface TmdbRawResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
}

function toSearchResult(raw: TmdbRawResult): TmdbSearchResult | null {
  if (raw.media_type !== 'movie' && raw.media_type !== 'tv') return null;

  const mediaType: MediaType = raw.media_type;
  const name = mediaType === 'movie' ? raw.title : raw.name;
  const dateStr = mediaType === 'movie' ? raw.release_date : raw.first_air_date;
  const year = dateStr ? Number(dateStr.slice(0, 4)) : null;

  return {
    tmdbId: raw.id,
    mediaType,
    name: name ?? 'Untitled',
    summary: raw.overview ?? '',
    posterPath: raw.poster_path,
    year: Number.isNaN(year) ? null : year,
  };
}

export async function searchTitles(query: string, signal?: AbortSignal): Promise<TmdbSearchResult[]> {
  if (!query.trim()) return [];

  const url = new URL(`${TMDB_BASE_URL}/search/multi`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('query', query);
  url.searchParams.set('include_adult', 'false');

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);

  const data = (await res.json()) as { results: TmdbRawResult[] };
  return data.results.map(toSearchResult).filter((r): r is TmdbSearchResult => r !== null);
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDetails {
  genres: TmdbGenre[];
  runtime?: number;
  episode_run_time?: number[];
}

export async function fetchTitleDetails(
  tmdbId: number,
  mediaType: MediaType,
): Promise<{ genre: string[]; runtimeMinutes: number | null }> {
  const url = new URL(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}`);
  url.searchParams.set('api_key', TMDB_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB details failed: ${res.status}`);

  const data = (await res.json()) as TmdbDetails;
  const genre = data.genres?.map((g) => g.name) ?? [];
  const runtimeMinutes =
    mediaType === 'movie'
      ? data.runtime ?? null
      : data.episode_run_time?.[0] ?? null;

  return { genre, runtimeMinutes };
}

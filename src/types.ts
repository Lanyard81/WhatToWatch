export type RatingMode = 'shared' | 'individual';
export type MediaType = 'movie' | 'tv';
export type TitleStatus = 'want_to_watch' | 'watching' | 'watched';

export interface Household {
  id: string;
  name: string;
  ratingMode: RatingMode;
  createdAt: number;
  memberIds: string[];
}

export interface Member {
  id: string;
  displayName: string;
  joinedAt: number;
}

export interface Title {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  name: string;
  summary: string;
  posterPath: string | null;
  genre: string[];
  year: number | null;
  runtimeMinutes: number | null;
  status: TitleStatus;
  watchedAt: number | null;
  addedBy: string;
  addedAt: number;
  tags: string[];
  wouldRewatch: boolean;
  notes: string;
  optedOut: string[];
}

export interface Rating {
  id: string;
  memberId: string | null;
  rating: number;
  createdAt: number;
}

export interface TmdbSearchResult {
  tmdbId: number;
  mediaType: MediaType;
  name: string;
  summary: string;
  posterPath: string | null;
  year: number | null;
}

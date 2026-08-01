import { useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { parseCsv } from '../lib/csv';
import { searchTitles, fetchTitleDetails } from '../lib/tmdb';
import { setRating, SHARED_RATING_DOC_ID } from '../hooks/useRatings';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useExistingTmdbIds } from '../hooks/useExistingTmdbIds';

const MAX_ROWS = 150;

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of Object.keys(row)) {
    if (keys.some((k) => key.toLowerCase() === k.toLowerCase())) return row[key];
  }
  return '';
}

interface ImportRow {
  name: string;
  year: number | null;
  rating: number | null; // normalized to 1-10
  watchedAt: number | null;
}

function normalizeRows(rows: Record<string, string>[]): ImportRow[] {
  return rows
    .map((row) => {
      const name = pick(row, ['Name', 'Title']).trim();
      const yearStr = pick(row, ['Year']);
      const dateStr = pick(row, ['Watched Date', 'Date Rated', 'Date']);
      const letterboxdRating = pick(row, ['Rating']); // 0.5–5 stars
      const imdbRating = pick(row, ['Your Rating']); // 1–10

      let rating: number | null = null;
      if (imdbRating) rating = Math.round(Number(imdbRating));
      else if (letterboxdRating) rating = Math.round(Number(letterboxdRating) * 2);

      const watchedAt = dateStr ? new Date(`${dateStr}T12:00:00`).getTime() : null;

      return {
        name,
        year: yearStr ? Number(yearStr) : null,
        rating: rating && rating >= 1 && rating <= 10 ? rating : null,
        watchedAt: watchedAt && !Number.isNaN(watchedAt) ? watchedAt : null,
      };
    })
    .filter((r) => r.name);
}

export function ImportHistorySection() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const existingTmdbIds = useExistingTmdbIds(household?.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, added: 0, skipped: 0 });
  const [summary, setSummary] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !household || !user) return;

    const text = await file.text();
    const rows = normalizeRows(parseCsv(text)).slice(0, MAX_ROWS);
    if (rows.length === 0) {
      setSummary('No usable rows found — expected a Letterboxd or IMDb ratings/watched export.');
      return;
    }

    setImporting(true);
    setSummary(null);
    let added = 0;
    let skipped = 0;
    setProgress({ done: 0, total: rows.length, added: 0, skipped: 0 });

    for (const row of rows) {
      try {
        const query = row.year ? `${row.name} ${row.year}` : row.name;
        const results = await searchTitles(query);
        const match =
          results.find((r) => r.name.toLowerCase() === row.name.toLowerCase() && (!row.year || r.year === row.year)) ??
          results[0];

        if (!match || existingTmdbIds.has(match.tmdbId)) {
          skipped++;
        } else {
          const details = await fetchTitleDetails(match.tmdbId, match.mediaType);
          const ref = await addDoc(collection(db, 'households', household.id, 'titles'), {
            tmdbId: match.tmdbId,
            mediaType: match.mediaType,
            name: match.name,
            summary: match.summary,
            posterPath: match.posterPath,
            genre: details.genre,
            year: match.year,
            runtimeMinutes: details.runtimeMinutes,
            status: 'watched',
            watchedAt: row.watchedAt ? Timestamp.fromMillis(row.watchedAt) : serverTimestamp(),
            addedBy: user.uid,
            addedAt: serverTimestamp(),
            tags: ['imported'],
            wouldRewatch: false,
            notes: '',
          });
          if (row.rating != null) {
            await setRating(household.id, ref.id, SHARED_RATING_DOC_ID, null, row.rating);
          }
          added++;
        }
      } catch {
        skipped++;
      }
      setProgress((p) => ({ ...p, done: p.done + 1, added, skipped }));
    }

    setImporting(false);
    setSummary(`Imported ${added} title${added === 1 ? '' : 's'}${skipped ? `, skipped ${skipped}` : ''}.`);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <section>
      <h3>Import watch history</h3>
      <p className="hint">
        Best-effort import from a Letterboxd or IMDb CSV export — matches each row to TMDB, so
        some titles may be skipped or mismatched. Imported titles are tagged "imported" so you
        can review them. Large files are capped at {MAX_ROWS} rows per import.
      </p>
      <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} disabled={importing} />
      {importing && (
        <p className="hint">
          Importing {progress.done}/{progress.total}… ({progress.added} added, {progress.skipped} skipped)
        </p>
      )}
      {summary && <p className="hint">{summary}</p>}
    </section>
  );
}

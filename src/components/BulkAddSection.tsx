import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { searchTitles, fetchTitleDetails } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useExistingTmdbIds } from '../hooks/useExistingTmdbIds';

const MAX_LINES = 200;

interface LineResult {
  input: string;
  status: 'added' | 'already-there' | 'not-found';
  matchedName?: string;
  matchedYear?: number | null;
}

export function BulkAddSection() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const existingTmdbIds = useExistingTmdbIds(household?.id);

  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<LineResult[] | null>(null);

  async function handleAdd() {
    if (!household || !user) return;
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, MAX_LINES);
    if (lines.length === 0) return;

    setImporting(true);
    setResults(null);
    setProgress({ done: 0, total: lines.length });
    const lineResults: LineResult[] = [];

    for (const line of lines) {
      try {
        const found = await searchTitles(line);
        const match = found[0];

        if (!match) {
          lineResults.push({ input: line, status: 'not-found' });
        } else if (existingTmdbIds.has(match.tmdbId)) {
          lineResults.push({ input: line, status: 'already-there', matchedName: match.name, matchedYear: match.year });
        } else {
          const details = await fetchTitleDetails(match.tmdbId, match.mediaType);
          await addDoc(collection(db, 'households', household.id, 'titles'), {
            tmdbId: match.tmdbId,
            mediaType: match.mediaType,
            name: match.name,
            summary: match.summary,
            posterPath: match.posterPath,
            genre: details.genre,
            year: match.year,
            runtimeMinutes: details.runtimeMinutes,
            status: 'want_to_watch',
            watchedAt: null,
            addedBy: user.uid,
            addedAt: serverTimestamp(),
            tags: ['imported'],
            wouldRewatch: false,
            notes: '',
          });
          lineResults.push({ input: line, status: 'added', matchedName: match.name, matchedYear: match.year });
        }
      } catch {
        lineResults.push({ input: line, status: 'not-found' });
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResults(lineResults);
    setImporting(false);
  }

  const addedCount = results?.filter((r) => r.status === 'added').length ?? 0;

  return (
    <section>
      <h3>Add a list of titles</h3>
      <p className="hint">
        Paste titles, one per line — each gets matched to TMDB and added to Want to Watch. Tagged
        "imported" so you can spot-check matches afterward (ambiguous titles like remakes can
        match the wrong one).
      </p>
      <textarea
        className="notes-input"
        rows={6}
        placeholder={'Mona Lisa Smile\nStarship Troopers\n...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={importing}
      />
      <button type="button" onClick={handleAdd} disabled={importing || !text.trim()}>
        {importing ? `Adding ${progress.done}/${progress.total}…` : 'Add all'}
      </button>

      {results && (
        <div className="bulk-add-results">
          <p className="hint">
            Added {addedCount} of {results.length}.
          </p>
          <ul>
            {results.map((r, i) => (
              <li key={i} className={`bulk-add-result-${r.status}`}>
                {r.input}
                {r.status === 'added' && ` → ${r.matchedName}${r.matchedYear ? ` (${r.matchedYear})` : ''}`}
                {r.status === 'already-there' && ' — already on a list'}
                {r.status === 'not-found' && ' — no TMDB match, add manually via Search'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

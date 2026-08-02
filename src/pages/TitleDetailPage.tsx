import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { arrayRemove, arrayUnion, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { usePendingDelete } from '../context/PendingDeleteContext';
import { useTitle } from '../hooks/useTitle';
import { useMembers } from '../hooks/useMembers';
import { useRatings, setRating, SHARED_RATING_DOC_ID } from '../hooks/useRatings';
import { useHouseholdTags, upsertHouseholdTag } from '../hooks/useHouseholdTags';
import { TMDB_POSTER_BASE } from '../lib/tmdb';
import { TagInput } from '../components/TagInput';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function listPathFor(status: string) {
  if (status === 'watching') return '/watching';
  if (status === 'watched') return '/watched';
  return '/';
}

const BACK_LABELS: Record<string, string> = {
  '/': 'Want to Watch',
  '/watching': 'Watching',
  '/watched': 'Watched',
  '/search': 'Search',
  '/stats': 'Stats',
};

export function TitleDetailPage() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { title, loading, error } = useTitle(household?.id, titleId);
  const { members } = useMembers(household?.id);
  const { ratings } = useRatings(household?.id, titleId);
  const householdTags = useHouseholdTags(household?.id);
  const { pendingIds, requestDelete, undoDelete } = usePendingDelete();

  const [watchedDate, setWatchedDate] = useState(todayInputValue());
  const [marking, setMarking] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (title && !notesDirty) setNotes(title.notes ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title?.id, title?.notes]);

  const memberNames = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.displayName));
    return map;
  }, [members]);

  if (loading) {
    return <div className="page centered-screen">Loading…</div>;
  }

  if (error) {
    return (
      <div className="page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!title || !household) {
    return (
      <div className="page">
        <p className="empty-state">This title couldn't be found.</p>
        <button type="button" onClick={() => navigate('/')}>
          Back to Want to Watch
        </button>
      </div>
    );
  }

  const titleRef = doc(db, 'households', household.id, 'titles', title.id);
  // Prefer where the user actually came from (a search result, a poster
  // carousel on any list, etc.) over the status-derived guess, which is
  // only right about half the time once a title can live on several lists.
  const cameFrom = (location.state as { from?: string } | null)?.from;
  const backTo = cameFrom ?? listPathFor(title.status);
  const backLabel = BACK_LABELS[backTo] ?? BACK_LABELS[listPathFor(title.status)];

  async function confirmMarkWatched() {
    const watchedAtMillis = new Date(`${watchedDate}T12:00:00`).getTime();
    await updateDoc(titleRef, {
      status: 'watched',
      watchedAt: Timestamp.fromMillis(watchedAtMillis),
    });
    setMarking(false);
  }

  async function toggleRewatch() {
    await updateDoc(titleRef, { wouldRewatch: !title!.wouldRewatch });
  }

  async function setWantsToWatch(wants: boolean) {
    if (!user) return;
    await updateDoc(titleRef, {
      optedOut: wants ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }

  async function addTag(tag: string) {
    await updateDoc(titleRef, { tags: arrayUnion(tag) });
    await upsertHouseholdTag(household!.id, tag);
  }

  async function removeTag(tag: string) {
    await updateDoc(titleRef, { tags: arrayRemove(tag) });
  }

  async function saveNotes() {
    await updateDoc(titleRef, { notes });
    setNotesDirty(false);
  }

  function handleDelete() {
    requestDelete(household!.id, title!.id, title!.name);
    navigate(backTo, { replace: true });
  }

  async function handleRate(docId: string, memberId: string | null, value: number) {
    await setRating(household!.id, title!.id, docId, memberId, value);
  }

  const sharedRating = ratings.find((r) => r.id === SHARED_RATING_DOC_ID);
  const myRating = user ? ratings.find((r) => r.id === user.uid) : undefined;

  return (
    <div className="page detail-page">
      <button type="button" className="secondary back-button" onClick={() => navigate(backTo)}>
        ← Back to {backLabel}
      </button>

      {pendingIds.has(title.id) && (
        <div className="pending-delete-banner">
          <span>This title is being deleted…</span>
          <button type="button" className="secondary" onClick={() => undoDelete(title.id)}>
            Undo
          </button>
        </div>
      )}

      <div className="detail-header">
        <div className="detail-poster">
          {title.posterPath ? (
            <img src={`${TMDB_POSTER_BASE}${title.posterPath}`} alt={title.name} />
          ) : (
            <div className="poster-placeholder" aria-hidden="true" />
          )}
        </div>
        <div>
          <span className={`badge badge-${title.mediaType}`}>
            {title.mediaType === 'movie' ? 'Movie' : 'TV'}
          </span>
          <h1>{title.name}</h1>
          <p className="title-card-meta">
            {title.year ?? '—'}
            {title.runtimeMinutes ? ` · ${title.runtimeMinutes} min` : ''}
            {title.genre.length ? ` · ${title.genre.join(', ')}` : ''}
          </p>
          {title.status === 'watched' && title.watchedAt && (
            <p className="title-card-meta">
              Watched {new Date(title.watchedAt).toLocaleDateString()}
            </p>
          )}
          {title.status === 'watching' && <p className="title-card-meta">Currently watching</p>}
          <p className="title-card-meta">
            Added by {memberNames.get(title.addedBy) ?? 'someone'} on{' '}
            {new Date(title.addedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {title.summary && <p>{title.summary}</p>}

      {(title.status === 'want_to_watch' || title.status === 'watching') && (
        <section>
          {marking ? (
            <div className="watched-confirm">
              <input type="date" value={watchedDate} onChange={(e) => setWatchedDate(e.target.value)} />
              <button type="button" onClick={confirmMarkWatched}>
                Confirm
              </button>
              <button type="button" className="secondary" onClick={() => setMarking(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setMarking(true)}>
              Mark watched
            </button>
          )}
        </section>
      )}

      {title.status === 'want_to_watch' && (
        <section>
          <h3>Who's in?</h3>
          <p className="hint">
            Everyone's assumed in until they say otherwise — say no and it'll fade to the bottom
            of your own Want to Watch list, without affecting anyone else's.
          </p>
          <div className="opt-in-list">
            {household.memberIds.map((memberId) => {
              const isOptedOut = title.optedOut.includes(memberId);
              const isMe = memberId === user?.uid;
              return (
                <div key={memberId} className="opt-in-row">
                  <span className="hint">{memberNames.get(memberId) ?? (isMe ? 'You' : 'Member')}</span>
                  {isMe ? (
                    <div className="opt-in-toggle" role="group" aria-label="Do you want to watch this?">
                      <button
                        type="button"
                        className={isOptedOut ? 'secondary' : ''}
                        onClick={() => setWantsToWatch(true)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={isOptedOut ? '' : 'secondary'}
                        onClick={() => setWantsToWatch(false)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <span className="hint">{isOptedOut ? 'Passed' : "Wants to watch"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {title.status === 'watched' && (
        <>
          <section>
            <h3>Would rewatch</h3>
            <button type="button" className={title.wouldRewatch ? '' : 'secondary'} onClick={toggleRewatch}>
              {title.wouldRewatch ? '★ Yes, would rewatch' : '☆ Would rewatch?'}
            </button>
          </section>

          <section>
            <h3>Rating</h3>
            {household.ratingMode === 'shared' ? (
              <RatingPicker
                value={sharedRating?.rating ?? null}
                onPick={(v) => handleRate(SHARED_RATING_DOC_ID, null, v)}
              />
            ) : (
              <div className="individual-ratings">
                {household.memberIds.map((memberId) => {
                  const r = ratings.find((rr) => rr.id === memberId);
                  const isMe = memberId === user?.uid;
                  return (
                    <div key={memberId} className="individual-rating-row">
                      <span className="hint">{memberNames.get(memberId) ?? (isMe ? 'You' : 'Member')}</span>
                      {isMe ? (
                        <RatingPicker value={myRating?.rating ?? null} onPick={(v) => handleRate(memberId, memberId, v)} />
                      ) : (
                        <span>{r ? `${r.rating}/10` : 'Not rated yet'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h3>Tags</h3>
            <div className="tag-list">
              {title.tags.map((tag) => (
                <button key={tag} type="button" className="tag-chip" onClick={() => removeTag(tag)} title="Remove tag">
                  {tag} ✕
                </button>
              ))}
            </div>
            <TagInput suggestions={householdTags} onAdd={addTag} />
          </section>
        </>
      )}

      <section>
        <h3>Notes</h3>
        <textarea
          className="notes-input"
          rows={3}
          placeholder="Any thoughts worth remembering…"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesDirty(true);
          }}
          onBlur={() => notesDirty && saveNotes()}
        />
      </section>

      <section>
        {confirmingDelete ? (
          <div className="watched-confirm">
            <p className="error">Delete "{title.name}" from the list?</p>
            <button type="button" className="danger" onClick={handleDelete}>
              Delete
            </button>
            <button type="button" className="secondary" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="secondary danger-text" onClick={() => setConfirmingDelete(true)}>
            Delete
          </button>
        )}
      </section>
    </div>
  );
}

function RatingPicker({ value, onPick }: { value: number | null; onPick: (value: number) => void }) {
  return (
    <div className="rating-picker" role="group" aria-label="Rating out of 10">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} out of 10`}
          aria-pressed={n === value}
          className={n === value ? 'rating-pick active' : 'rating-pick secondary'}
          onClick={() => onPick(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

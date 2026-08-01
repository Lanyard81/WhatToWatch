import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { arrayRemove, arrayUnion, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useTitle } from '../hooks/useTitle';
import { useMembers } from '../hooks/useMembers';
import { useRatings, setRating, SHARED_RATING_DOC_ID } from '../hooks/useRatings';
import { useHouseholdTags, upsertHouseholdTag } from '../hooks/useHouseholdTags';
import { TMDB_POSTER_BASE } from '../lib/tmdb';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function TitleDetailPage() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { title, loading, error } = useTitle(household?.id, titleId);
  const { members } = useMembers(household?.id);
  const { ratings } = useRatings(household?.id, titleId);
  const householdTags = useHouseholdTags(household?.id);

  const [watchedDate, setWatchedDate] = useState(todayInputValue());
  const [marking, setMarking] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    await updateDoc(titleRef, { tags: arrayUnion(trimmed) });
    await upsertHouseholdTag(household!.id, trimmed);
    setTagInput('');
  }

  async function removeTag(tag: string) {
    await updateDoc(titleRef, { tags: arrayRemove(tag) });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDoc(titleRef);
      navigate(title!.status === 'watched' ? '/watched' : '/', { replace: true });
    } finally {
      setDeleting(false);
    }
  }

  async function handleRate(docId: string, memberId: string | null, value: number) {
    await setRating(household!.id, title!.id, docId, memberId, value);
  }

  const sharedRating = ratings.find((r) => r.id === SHARED_RATING_DOC_ID);
  const myRating = user ? ratings.find((r) => r.id === user.uid) : undefined;

  return (
    <div className="page detail-page">
      <button type="button" className="secondary back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-header">
        <div className="detail-poster">
          {title.posterPath ? (
            <img src={`${TMDB_POSTER_BASE}${title.posterPath}`} alt="" />
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
        </div>
      </div>

      {title.summary && <p>{title.summary}</p>}

      {title.status === 'want_to_watch' && (
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
            <div className="tag-input-row">
              <input
                type="text"
                list="household-tags"
                placeholder="Add a tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <datalist id="household-tags">
                {householdTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <button type="button" onClick={addTag}>
                Add
              </button>
            </div>
          </section>
        </>
      )}

      <section>
        {confirmingDelete ? (
          <div className="watched-confirm">
            <p className="error">Delete "{title.name}" from the list?</p>
            <button type="button" className="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
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
    <div className="rating-picker">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={n === value ? 'rating-pick active' : 'rating-pick secondary'}
          onClick={() => onPick(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

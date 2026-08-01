import { useLocation, useNavigate } from 'react-router-dom';
import type { Title } from '../types';
import { TMDB_POSTER_BASE } from '../lib/tmdb';
import { useHousehold } from '../context/HouseholdContext';
import { useMembers } from '../hooks/useMembers';

interface TitleCardProps {
  title: Title;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export function TitleCard({ title, action, footer }: TitleCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { household } = useHousehold();
  const { members } = useMembers(household?.id);
  const addedByName = members.find((m) => m.id === title.addedBy)?.displayName;

  function openDetail() {
    navigate(`/title/${title.id}`, { state: { from: location.pathname } });
  }

  return (
    <div
      className="title-card"
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') openDetail();
      }}
    >
      <div className="title-card-poster">
        {title.posterPath ? (
          <img src={`${TMDB_POSTER_BASE}${title.posterPath}`} alt="" loading="lazy" />
        ) : (
          <div className="poster-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="title-card-body">
        <div className="title-card-heading">
          <span className={`badge badge-${title.mediaType}`}>
            {title.mediaType === 'movie' ? 'Movie' : 'TV'}
          </span>
          <h3>{title.name}</h3>
        </div>
        <p className="title-card-meta">
          {title.year ?? '—'}
          {title.runtimeMinutes ? ` · ${title.runtimeMinutes} min` : ''}
          {title.genre.length ? ` · ${title.genre.slice(0, 2).join(', ')}` : ''}
        </p>
        {title.summary && <p className="title-card-summary">{title.summary}</p>}
        <p className="title-card-meta title-card-added-by">
          {title.status === 'watched' && title.watchedAt
            ? `Watched ${new Date(title.watchedAt).toLocaleDateString()} · `
            : ''}
          Added by {addedByName ?? 'someone'}
        </p>
        {footer}
      </div>
      {action && (
        <div className="title-card-action" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      )}
    </div>
  );
}

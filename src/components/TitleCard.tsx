import { useNavigate } from 'react-router-dom';
import type { Title } from '../types';
import { TMDB_POSTER_BASE } from '../lib/tmdb';

interface TitleCardProps {
  title: Title;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export function TitleCard({ title, action, footer }: TitleCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="title-card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/title/${title.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/title/${title.id}`);
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
        {title.status === 'watched' && title.watchedAt && (
          <p className="title-card-meta">
            Watched {new Date(title.watchedAt).toLocaleDateString()}
          </p>
        )}
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

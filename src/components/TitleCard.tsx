import type { Title } from '../types';
import { TMDB_POSTER_BASE } from '../lib/tmdb';

interface TitleCardProps {
  title: Title;
  action?: React.ReactNode;
}

export function TitleCard({ title, action }: TitleCardProps) {
  return (
    <div className="title-card">
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
      </div>
      {action && <div className="title-card-action">{action}</div>}
    </div>
  );
}

import { useLocation, useNavigate } from 'react-router-dom';
import type { Title } from '../types';
import { TMDB_POSTER_BASE } from '../lib/tmdb';

export function PosterCarousel({ titles }: { titles: Title[] }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ul className="poster-carousel">
      {titles.map((title) => (
        <li key={title.id}>
          <button
            type="button"
            className="poster-tile"
            onClick={() => navigate(`/title/${title.id}`, { state: { from: location.pathname } })}
          >
            <span className="poster-tile-image">
              {title.posterPath ? (
                <img src={`${TMDB_POSTER_BASE}${title.posterPath}`} alt={title.name} loading="lazy" />
              ) : (
                <span className="poster-placeholder" aria-hidden="true" />
              )}
            </span>
            <span className={`badge badge-${title.mediaType} poster-tile-badge`}>
              {title.mediaType === 'movie' ? 'Movie' : 'TV'}
            </span>
            <span className="poster-tile-title">{title.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

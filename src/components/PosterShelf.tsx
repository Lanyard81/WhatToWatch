import { useLocation, useNavigate } from 'react-router-dom';
import type { Title } from '../types';
import { TMDB_POSTER_BASE } from '../lib/tmdb';

export function PosterShelf({ titles, dimmedIds }: { titles: Title[]; dimmedIds?: Set<string> }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ul className="poster-shelf">
      {titles.map((title) => (
        <li key={title.id}>
          <button
            type="button"
            className={dimmedIds?.has(title.id) ? 'poster-shelf-tile dimmed' : 'poster-shelf-tile'}
            onClick={() => navigate(`/title/${title.id}`, { state: { from: location.pathname } })}
          >
            <span className="poster-shelf-image">
              {title.posterPath ? (
                <img src={`${TMDB_POSTER_BASE}${title.posterPath}`} alt={title.name} loading="lazy" />
              ) : (
                <span className="poster-placeholder" aria-hidden="true" />
              )}
            </span>
            <span className="poster-shelf-title">{title.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

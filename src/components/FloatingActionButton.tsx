import { useNavigate } from 'react-router-dom';
import { icons } from './icons';

export function FloatingActionButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="fab"
      onClick={() => navigate('/search')}
      aria-label="Add a title"
    >
      {icons.plus}
    </button>
  );
}

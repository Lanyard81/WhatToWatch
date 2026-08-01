import { Link } from 'react-router-dom';
import { icons } from './icons';

export function TopBar() {
  return (
    <div className="top-bar">
      <Link to="/settings" className="top-bar-settings" aria-label="Settings">
        {icons.gear}
      </Link>
    </div>
  );
}

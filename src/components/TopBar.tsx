import { Link, useLocation } from 'react-router-dom';
import { icons } from './icons';
import { useHousehold } from '../context/HouseholdContext';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Want to Watch',
  '/watching': 'Watching',
  '/watched': 'Watched',
  '/search': 'Add a title',
  '/settings': 'Settings',
  '/stats': 'Stats',
};

export function TopBar() {
  const { household } = useHousehold();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname];

  return (
    <div className="top-bar">
      <div className="top-bar-titles">
        {household && <p className="top-bar-eyebrow">{household.name}</p>}
        {title && <h1 className="top-bar-title">{title}</h1>}
      </div>
      <Link to="/settings" className="top-bar-settings" aria-label="Settings">
        {icons.gear}
      </Link>
    </div>
  );
}

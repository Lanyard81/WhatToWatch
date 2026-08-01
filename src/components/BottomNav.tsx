import { NavLink } from 'react-router-dom';

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        Want to Watch
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>
        Add
      </NavLink>
      <NavLink to="/watched" className={({ isActive }) => (isActive ? 'active' : '')}>
        Watched
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
        Settings
      </NavLink>
    </nav>
  );
}

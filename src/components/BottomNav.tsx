import { NavLink } from 'react-router-dom';
import { icons, type IconName } from './icons';

function NavItem({ to, end, icon, label }: { to: string; end?: boolean; icon: IconName; label: string }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
      <span className="nav-icon" aria-hidden="true">
        {icons[icon]}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavItem to="/" end icon="list" label="Want" />
      <NavItem to="/watching" icon="play" label="Watching" />
      <NavItem to="/watched" icon="check" label="Watched" />
    </nav>
  );
}

import { useEffect, useRef } from 'react';
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
  const barRef = useRef<HTMLDivElement>(null);

  // Sticky elements below this one (e.g. the detail page's back button) need
  // to know exactly how tall this bar renders — it varies with a wrapped
  // household name or a two-line page title — so they can stick flush
  // underneath instead of using a guessed pixel value. ResizeObserver alone
  // isn't enough: the self-hosted webfont swaps in asynchronously after
  // first paint, reflowing the text (and changing the bar's height) without
  // always firing a fresh observer callback, so we also re-measure once
  // document.fonts is ready.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty('--top-bar-height', `${el.offsetHeight}px`);
    };
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    document.fonts?.ready?.then(setHeight);
    // Belt-and-suspenders: catches any late reflow the above two miss.
    const settleTimer = setTimeout(setHeight, 300);
    return () => {
      observer.disconnect();
      clearTimeout(settleTimer);
    };
  }, [household?.name, title]);

  return (
    <div className="top-bar" ref={barRef}>
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

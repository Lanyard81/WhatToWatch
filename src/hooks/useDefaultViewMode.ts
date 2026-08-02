import { useState } from 'react';
import type { ViewMode } from './useViewMode';

const VALID: ViewMode[] = ['list', 'carousel', 'shelf'];
const STORAGE_KEY = 'whattowatch:defaultView';

// The app-wide fallback view (Settings → Default view) used the first time
// any given list hasn't had its own view explicitly picked yet. Once a list
// has its own stored choice (see useViewMode), that always wins — this only
// seeds the starting point.
export function useDefaultViewMode() {
  const [defaultMode, setDefaultModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID.includes(stored as ViewMode) ? (stored as ViewMode) : 'shelf';
  });

  function setDefaultMode(next: ViewMode) {
    localStorage.setItem(STORAGE_KEY, next);
    setDefaultModeState(next);
  }

  return [defaultMode, setDefaultMode] as const;
}

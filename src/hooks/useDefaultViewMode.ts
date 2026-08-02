import { useState } from 'react';
import type { ViewMode } from './useViewMode';

const VALID: ViewMode[] = ['list', 'carousel', 'shelf'];
const STORAGE_KEY = 'whattowatch:defaultView';
const LIST_KEYS = ['want_to_watch', 'watching', 'watched'];

// Settings → Default view. Picking one here doesn't just seed lists that
// have never had a view chosen — it applies immediately to all three lists
// (Want to Watch, Watching, Watched), overwriting whatever each one had
// stored. That's what "set the default" means in practice: the point where
// you'd reach for this setting is exactly when you want everything to
// match it right now, not just future lists. Each list's own view-toggle
// still works like normal afterwards, independently, until this is changed
// again.
export function useDefaultViewMode() {
  const [defaultMode, setDefaultModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID.includes(stored as ViewMode) ? (stored as ViewMode) : 'shelf';
  });

  function setDefaultMode(next: ViewMode) {
    localStorage.setItem(STORAGE_KEY, next);
    LIST_KEYS.forEach((key) => localStorage.setItem(`whattowatch:view:${key}`, next));
    setDefaultModeState(next);
  }

  return [defaultMode, setDefaultMode] as const;
}

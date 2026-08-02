import { useState } from 'react';

export type ViewMode = 'list' | 'carousel' | 'shelf';

const VALID: ViewMode[] = ['list', 'carousel', 'shelf'];

export function useViewMode(key: string, defaultMode: ViewMode = 'list') {
  const storageKey = `whattowatch:view:${key}`;
  const [mode, setModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(storageKey);
    return VALID.includes(stored as ViewMode) ? (stored as ViewMode) : defaultMode;
  });

  function setMode(next: ViewMode) {
    localStorage.setItem(storageKey, next);
    setModeState(next);
  }

  return [mode, setMode] as const;
}

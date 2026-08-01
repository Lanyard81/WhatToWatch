import { useState } from 'react';

export type ViewMode = 'list' | 'carousel';

export function useViewMode(key: string, defaultMode: ViewMode = 'list') {
  const storageKey = `whattowatch:view:${key}`;
  const [mode, setModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored === 'list' || stored === 'carousel' ? stored : defaultMode;
  });

  function setMode(next: ViewMode) {
    localStorage.setItem(storageKey, next);
    setModeState(next);
  }

  return [mode, setMode] as const;
}

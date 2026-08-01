import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Accent = 'purple' | 'blue' | 'green' | 'rose';

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'purple', label: 'Purple', swatch: '#aa3bff' },
  { id: 'blue', label: 'Blue', swatch: '#2f7dff' },
  { id: 'green', label: 'Green', swatch: '#22b573' },
  { id: 'rose', label: 'Rose', swatch: '#e63b7a' },
];

const THEME_KEY = 'whattowatch:theme';
const ACCENT_KEY = 'whattowatch:accent';

interface ThemeContextValue {
  theme: ThemeMode;
  accent: Accent;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function readStoredAccent(): Accent {
  const stored = localStorage.getItem(ACCENT_KEY);
  return ACCENTS.some((a) => a.id === stored) ? (stored as Accent) : 'purple';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [accent, setAccentState] = useState<Accent>(readStoredAccent);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    const meta = document.querySelector('meta[name="theme-color"]');
    const swatch = ACCENTS.find((a) => a.id === accent)?.swatch;
    if (meta && swatch) meta.setAttribute('content', swatch);
  }, [accent]);

  function setTheme(next: ThemeMode) {
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }

  function setAccent(next: Accent) {
    localStorage.setItem(ACCENT_KEY, next);
    setAccentState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

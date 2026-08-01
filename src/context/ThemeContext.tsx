import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'olive' | 'terracotta' | 'indigo' | 'rosewood';

export const SCHEMES: { id: ColorScheme; label: string; swatch: string }[] = [
  { id: 'olive', label: 'Olive Grove', swatch: '#33502f' },
  { id: 'terracotta', label: 'Terracotta', swatch: '#8a3b24' },
  { id: 'indigo', label: 'Indigo Dusk', swatch: '#33395a' },
  { id: 'rosewood', label: 'Rosewood', swatch: '#5c2a3d' },
];

const THEME_KEY = 'whattowatch:theme';
const SCHEME_KEY = 'whattowatch:scheme';
const THEME_COLOR = { light: '#f2f0e6', dark: '#161a13' };

interface ThemeContextValue {
  theme: ThemeMode;
  scheme: ColorScheme;
  setTheme: (theme: ThemeMode) => void;
  setScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function readStoredScheme(): ColorScheme {
  const stored = localStorage.getItem(SCHEME_KEY);
  return SCHEMES.some((s) => s.id === stored) ? (stored as ColorScheme) : 'olive';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [scheme, setSchemeState] = useState<ColorScheme>(readStoredScheme);

  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (theme === 'system') {
      root.removeAttribute('data-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      meta?.setAttribute('content', prefersDark ? THEME_COLOR.dark : THEME_COLOR.light);
    } else {
      root.setAttribute('data-theme', theme);
      meta?.setAttribute('content', THEME_COLOR[theme]);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-scheme', scheme);
  }, [scheme]);

  function setTheme(next: ThemeMode) {
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }

  function setScheme(next: ColorScheme) {
    localStorage.setItem(SCHEME_KEY, next);
    setSchemeState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, scheme, setTheme, setScheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Day / night theme. Until the visitor picks one, the system preference decides
 * (and is followed live); the switch then stores 'light' or 'dark' for this browser.
 * The resolved theme goes to <html data-theme> — the inline script in index.html does
 * the same before the first paint, so a dark page never flashes white while JS loads.
 */
export const THEME_STORAGE_KEY = 'ai-finder-theme';
const META_COLORS = { light: '#e9ecef', dark: '#0b0e11' };

function readStored() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

const darkQuery = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [chosen, setChosen] = useState(readStored);
  const [systemDark, setSystemDark] = useState(() => Boolean(darkQuery()?.matches));

  // follow the OS setting until the visitor makes a choice
  useEffect(() => {
    const query = darkQuery();
    if (!query) return undefined;
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = chosen ?? (systemDark ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[theme]);
  }, [theme]);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setChosen(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice lasts for this visit */
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

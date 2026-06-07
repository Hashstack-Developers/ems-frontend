'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  THEME_STORAGE_KEY,
  type ColorMode,
  getColorMode,
} from '@/constants/theme';

const TRANSITION_MS = 520;

interface ThemeContextValue {
  mode: ColorMode;
  mounted: boolean;
  toggleTheme: (e?: React.MouseEvent) => void;
  setTheme: (mode: ColorMode, e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(mode: ColorMode, animate: boolean, e?: React.MouseEvent) {
  const root = document.documentElement;
  root.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light');

  if (e) {
    root.style.setProperty('--theme-x', `${e.clientX}px`);
    root.style.setProperty('--theme-y', `${e.clientY}px`);
  }

  if (animate) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), TRANSITION_MS);
  }

  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getColorMode();
    setMode(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: ColorMode, e?: React.MouseEvent) => {
    setMode(next);
    applyTheme(next, true, e);
  }, []);

  const toggleTheme = useCallback((e?: React.MouseEvent) => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      applyTheme(next, true, e);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, mounted, toggleTheme, setTheme }),
    [mode, mounted, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

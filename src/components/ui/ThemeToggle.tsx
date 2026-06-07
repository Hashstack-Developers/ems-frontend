'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { mode, mounted, toggleTheme } = useTheme();
  const isDark = mode === 'dark';

  if (!mounted) {
    return <div className={`theme-toggle-skeleton ${className}`} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle group/toggle ${isDark ? 'theme-toggle-dark' : ''} ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {showLabel && (
        <span className="mr-2 text-xs font-medium text-muted">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
      <span className="theme-toggle-track">
        <span className="theme-toggle-glow" aria-hidden />
        <span className="theme-toggle-thumb">
          <span className="theme-toggle-icon theme-toggle-sun" aria-hidden>☀️</span>
          <span className="theme-toggle-icon theme-toggle-moon" aria-hidden>🌙</span>
        </span>
      </span>
    </button>
  );
}

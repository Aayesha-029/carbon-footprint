import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const ThemeToggle = () => {
  const { settings, updateSettings, applyTheme } = useSettings();

  // --- Resolve initial theme: localStorage FIRST (survives refresh), then context, then DOM ---
  const readStoredTheme = () => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (_) { /* noop */ }

    if (settings?.theme === 'dark' || settings?.theme === 'light') {
      return settings.theme;
    }

    if (typeof document !== 'undefined' &&
        (document.body.classList.contains('dark-theme') ||
         document.documentElement.classList.contains('dark-theme'))) {
      return 'dark';
    }

    return 'light';
  };

  const [theme, setTheme] = useState(readStoredTheme);
  const isDark = theme === 'dark';

  // --- Apply the theme to <html> AND <body> on mount and on every change ---
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark-theme');
      body.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      body.classList.remove('dark-theme');
    }
  }, [isDark]);

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark';

    // 1. Flip local state (instant UI feedback)
    setTheme(next);

    // 2. Apply to DOM immediately — both <html> and <body> so nothing misses it
    const root = document.documentElement;
    const body = document.body;
    if (next === 'dark') {
      root.classList.add('dark-theme');
      body.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      body.classList.remove('dark-theme');
    }

    // 3. Notify SettingsContext (in case applyTheme exists)
    if (typeof applyTheme === 'function') {
      try { applyTheme(next); } catch (_) { /* noop */ }
    }

    // 4. Persist to localStorage — the source of truth across refreshes
    try { localStorage.setItem('theme', next); } catch (_) { /* noop */ }

    // 5. Persist to backend (fire and forget — doesn't block UI)
    if (typeof updateSettings === 'function') {
      Promise.resolve(updateSettings({ theme: next }))
        .catch((err) => console.warn('Failed to persist theme to backend:', err));
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="app-theme-toggle"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
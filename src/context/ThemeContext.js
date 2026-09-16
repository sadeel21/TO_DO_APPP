/**
 * React concept: Context API (createContext + useContext + Provider)
 *
 * Three appearance modes: light, dark, and auto (dark after 6:30 PM,
 * light after 6:30 AM, using the device clock — no location/sunset API).
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightColors = {
  background: '#EEF0F4',
  backgroundGlow: '#C4B5FD',
  card: '#FFFFFF',
  text: '#14101F',
  muted: '#4B4458',
  border: '#C9C5D4',
  accent: '#6D28D9',
  accentSoft: '#DDD6FE',
  accentText: '#FFFFFF',
  danger: '#BE123C',
  dangerSoft: '#FFE4E6',
  checkbox: '#A8A0B8',
  checkboxOn: '#6D28D9',
  shadow: '#4C1D95',
  progressTrack: '#D8D6E0',
  stats: {
    tasks: { fill: '#2563EB', soft: '#DBEAFE', ink: '#1E3A8A' },
    dhikr: { fill: '#0D9488', soft: '#CCFBF1', ink: '#115E59' },
    streak: { fill: '#EA580C', soft: '#FFEDD5', ink: '#9A3412' },
  },
  badge: {
    'first-week': { fill: '#EA580C', soft: '#FFEDD5', ink: '#9A3412', lockedFill: '#FB923C' },
    dedicated: { fill: '#DC2626', soft: '#FECACA', ink: '#991B1B', lockedFill: '#F87171' },
    century: { fill: '#D97706', soft: '#FDE68A', ink: '#92400E', lockedFill: '#FBBF24' },
    'early-bird': { fill: '#2563EB', soft: '#BFDBFE', ink: '#1E3A8A', lockedFill: '#60A5FA' },
    remembrance: { fill: '#DB2777', soft: '#FBCFE8', ink: '#9D174D', lockedFill: '#F472B6' },
  },
};

const darkColors = {
  background: '#100C18',
  backgroundGlow: '#5B21B6',
  card: '#1E1630',
  text: '#F8F7FC',
  muted: '#C9C2D9',
  border: '#4C3F66',
  accent: '#A78BFA',
  accentSoft: '#4C1D95',
  accentText: '#FFFFFF',
  danger: '#FB7185',
  dangerSoft: '#4C0519',
  checkbox: '#6B6280',
  checkboxOn: '#A78BFA',
  shadow: '#000000',
  progressTrack: '#342A48',
  stats: {
    tasks: { fill: '#60A5FA', soft: '#1E3A8A', ink: '#BFDBFE' },
    dhikr: { fill: '#2DD4BF', soft: '#115E59', ink: '#CCFBF1' },
    streak: { fill: '#FB923C', soft: '#7C2D12', ink: '#FED7AA' },
  },
  badge: {
    'first-week': { fill: '#FB923C', soft: '#7C2D12', ink: '#FED7AA', lockedFill: '#C2410C' },
    dedicated: { fill: '#F87171', soft: '#7F1D1D', ink: '#FECACA', lockedFill: '#B91C1C' },
    century: { fill: '#FBBF24', soft: '#78350F', ink: '#FDE68A', lockedFill: '#B45309' },
    'early-bird': { fill: '#60A5FA', soft: '#1E3A8A', ink: '#BFDBFE', lockedFill: '#1D4ED8' },
    remembrance: { fill: '#F472B6', soft: '#9D174D', ink: '#FBCFE8', lockedFill: '#BE185D' },
  },
};

const ThemeContext = createContext(null);

const THEME_KEY = '@todo/theme';
const DARK_START_MINUTES = 18 * 60 + 30;
const LIGHT_START_MINUTES = 6 * 60 + 30;

function isNightNow(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= DARK_START_MINUTES || minutes < LIGHT_START_MINUTES;
}

function shouldBeDark(mode, date = new Date()) {
  if (mode === 'dark') {
    return true;
  }
  if (mode === 'light') {
    return false;
  }
  return isNightNow(date);
}

function normalizeMode(raw) {
  if (raw === 'dark' || raw === 'light' || raw === 'auto') {
    return raw;
  }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((raw) => {
        if (raw) {
          setMode(normalizeMode(raw));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = (state) => {
      if (state === 'active') {
        setClock(new Date());
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    const timer = setInterval(() => setClock(new Date()), 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const isDark = shouldBeDark(mode, clock);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setThemeMode: (next) => {
        const safe = normalizeMode(next);
        setMode(safe);
        AsyncStorage.setItem(THEME_KEY, safe).catch(() => {});
      },
      // Kept for older callers: flips between light and dark (leaves auto).
      toggleTheme: () => {
        const next = isDark ? 'light' : 'dark';
        setMode(next);
        AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      },
    }),
    [mode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}

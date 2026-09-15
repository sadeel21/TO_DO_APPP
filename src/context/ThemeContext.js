/**
 * React concept: Context API (createContext + useContext + Provider)
 *
 * Context lets any child read the theme without "prop drilling"
 * (passing theme through every parent in between).
 */
import { createContext, useContext, useMemo, useState } from 'react';

// Light: cooler gray canvas, deep ink, saturated violet — not washed lilac.
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
  badge: {
    'first-week': { fill: '#EA580C', soft: '#FFEDD5', ink: '#9A3412', lockedFill: '#FB923C' },
    dedicated: { fill: '#DC2626', soft: '#FECACA', ink: '#991B1B', lockedFill: '#F87171' },
    century: { fill: '#D97706', soft: '#FDE68A', ink: '#92400E', lockedFill: '#FBBF24' },
    'early-bird': { fill: '#2563EB', soft: '#BFDBFE', ink: '#1E3A8A', lockedFill: '#60A5FA' },
    remembrance: { fill: '#DB2777', soft: '#FBCFE8', ink: '#9D174D', lockedFill: '#F472B6' },
  },
};

// Dark: richer plum, bright type, vivid accents.
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
  badge: {
    'first-week': { fill: '#FB923C', soft: '#7C2D12', ink: '#FED7AA', lockedFill: '#C2410C' },
    dedicated: { fill: '#F87171', soft: '#7F1D1D', ink: '#FECACA', lockedFill: '#B91C1C' },
    century: { fill: '#FBBF24', soft: '#78350F', ink: '#FDE68A', lockedFill: '#B45309' },
    'early-bird': { fill: '#60A5FA', soft: '#1E3A8A', ink: '#BFDBFE', lockedFill: '#1D4ED8' },
    remembrance: { fill: '#F472B6', soft: '#9D174D', ink: '#FBCFE8', lockedFill: '#BE185D' },
  },
};

const ThemeContext = createContext(null);

/**
 * Wraps the app and provides { isDark, colors, toggleTheme }.
 * children = whatever you nest inside <ThemeProvider> (composition).
 */
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const value = useMemo(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
      toggleTheme: () => setIsDark((prev) => !prev),
    }),
    [isDark]
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

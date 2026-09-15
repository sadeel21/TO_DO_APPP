/**
 * React concepts: Context + useEffect for persistence and a daily reset
 *
 * Counts live here so the Dhikr screen and history share one source of truth.
 * When the stored date is not today, yesterday’s totals move into history.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { DHIKR_ITEMS, defaultGoals, emptyCounts, todayKey } from '@/constants/dhikr';

const STORAGE_KEY = '@todo/dhikr';

function rollToToday(state) {
  const today = todayKey();
  if (state.date === today) {
    return state;
  }

  const history = { ...(state.history || {}) };
  const hadCounts = Object.values(state.counts || {}).some((value) => value > 0);
  if (state.date && hadCounts) {
    history[state.date] = { ...state.counts };
  }

  return {
    date: today,
    counts: emptyCounts(),
    goals: { ...defaultGoals(), ...(state.goals || {}) },
    history,
  };
}

function buildInitial() {
  return {
    date: todayKey(),
    counts: emptyCounts(),
    goals: defaultGoals(),
    history: {},
  };
}

const DhikrContext = createContext(null);

export function DhikrProvider({ children }) {
  const [state, setState] = useState(buildInitial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          setState(rollToToday({ ...buildInitial(), ...parsed }));
        } else if (!cancelled) {
          setState(rollToToday(buildInitial()));
        }
      } catch (error) {
        console.warn('Could not load dhikr', error);
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // If the app stays open past midnight, roll the day without a reload.
  useEffect(() => {
    const timer = setInterval(() => {
      setState((current) => rollToToday(current));
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) => {
      console.warn('Could not save dhikr', error);
    });
  }, [state, hydrated]);

  const value = useMemo(() => {
    function increment(id) {
      // Fire-and-forget: awaiting haptics can stall the count on web.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setState((current) => {
        const next = rollToToday(current);
        return {
          ...next,
          counts: {
            ...next.counts,
            [id]: (next.counts[id] || 0) + 1,
          },
        };
      });
    }

    function reset(id) {
      setState((current) => {
        const next = rollToToday(current);
        return {
          ...next,
          counts: { ...next.counts, [id]: 0 },
        };
      });
    }

    function setGoal(id, goal) {
      const safe = Math.max(1, Math.min(9999, Number(goal) || 1));
      setState((current) => ({
        ...rollToToday(current),
        goals: { ...current.goals, [id]: safe },
      }));
    }

    return {
      items: DHIKR_ITEMS,
      date: state.date,
      counts: state.counts,
      goals: state.goals,
      history: state.history,
      hydrated,
      increment,
      reset,
      setGoal,
    };
  }, [state, hydrated]);

  return <DhikrContext.Provider value={value}>{children}</DhikrContext.Provider>;
}

export function useDhikr() {
  const context = useContext(DhikrContext);
  if (!context) {
    throw new Error('useDhikr must be used inside DhikrProvider');
  }
  return context;
}

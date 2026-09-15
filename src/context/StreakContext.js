/**
 * React concepts: Context + useEffect on app load + AsyncStorage
 *
 * On hydrate, compare stored dates to today and rebuild current/longest.
 * Later, task completions and dhikr goals only add a day once.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useDhikr } from '@/context/DhikrContext';
import { useTasks } from '@/context/TaskContext';
import {
  deriveActiveDates,
  isMilestone,
  mergeDateSets,
  snapshotFromDates,
  toDayKey,
} from '@/utils/streakLogic';

const STORAGE_KEY = '@todo/streak';

const EMPTY = {
  activeDates: {},
  current: 0,
  longest: 0,
  lastActiveDate: null,
  lastChecked: null,
  lastCelebratedMilestone: 0,
};

function snapshotsEqual(a, b) {
  return (
    a.current === b.current &&
    a.longest === b.longest &&
    a.lastChecked === b.lastChecked &&
    a.lastActiveDate === b.lastActiveDate &&
    a.lastCelebratedMilestone === b.lastCelebratedMilestone &&
    JSON.stringify(a.activeDates) === JSON.stringify(b.activeDates)
  );
}

const StreakContext = createContext(null);

export function StreakProvider({ children }) {
  const { tasks, hydrated: tasksHydrated } = useTasks();
  const dhikr = useDhikr();
  const [state, setState] = useState(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState(() => toDayKey());
  const [celebration, setCelebration] = useState(null);
  const celebratedRef = useRef(0);
  const allowCelebration = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          celebratedRef.current = parsed.lastCelebratedMilestone || 0;
          setState({ ...EMPTY, ...parsed });
        }
      } catch (error) {
        console.warn('Could not load streak', error);
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

  // Re-run date math if the app stays open past midnight.
  useEffect(() => {
    const timer = setInterval(() => {
      setToday((current) => {
        const next = toDayKey();
        return current === next ? current : next;
      });
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // App-open check: merge activity from tasks + dhikr, then recompute
  // consecutive days against today's calendar date (not a timestamp).
  useEffect(() => {
    if (!hydrated || !tasksHydrated || !dhikr.hydrated) {
      return;
    }

    const derived = deriveActiveDates({ tasks, dhikr });

    setState((current) => {
      const merged = mergeDateSets(current.activeDates, derived);
      const next = snapshotFromDates(merged, current, today);
      if (snapshotsEqual(next, current) && allowCelebration.current) {
        return current;
      }
      // Don't pop the milestone toast for historical days loaded on first open.
      if (!allowCelebration.current) {
        if (isMilestone(next.current)) {
          celebratedRef.current = Math.max(celebratedRef.current, next.current);
          next.lastCelebratedMilestone = celebratedRef.current;
        }
        allowCelebration.current = true;
        return snapshotsEqual(next, current) ? current : next;
      }
      if (isMilestone(next.current) && next.current > celebratedRef.current) {
        celebratedRef.current = next.current;
        next.lastCelebratedMilestone = next.current;
        setTimeout(() => setCelebration(next.current), 0);
      }
      return next;
    });
  }, [
    hydrated,
    tasksHydrated,
    dhikr.hydrated,
    dhikr.date,
    dhikr.counts,
    dhikr.goals,
    dhikr.history,
    dhikr.items,
    tasks,
    today,
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) => {
      console.warn('Could not save streak', error);
    });
  }, [state, hydrated]);

  const value = useMemo(
    () => ({
      current: state.current,
      longest: state.longest,
      activeDates: state.activeDates,
      lastActiveDate: state.lastActiveDate,
      celebration,
      dismissCelebration: () => setCelebration(null),
    }),
    [state, celebration]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used inside StreakProvider');
  }
  return context;
}

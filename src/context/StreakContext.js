/**
 * React concepts: Context + useEffect on app load
 *
 * On hydrate, fetch the streak row, merge activity from tasks + dhikr,
 * then PUT the snapshot back to PostgreSQL.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useDhikr } from '@/context/DhikrContext';
import { useTasks } from '@/context/TaskContext';
import { useUser } from '@/context/UserContext';
import { getStreak, setApiUserId, updateStreak } from '@/utils/api';
import {
  deriveActiveDates,
  isMilestone,
  mergeDateSets,
  snapshotFromDates,
  toDayKey,
} from '@/utils/streakLogic';

const EMPTY = {
  activeDates: {},
  current: 0,
  longest: 0,
  lastActiveDate: null,
  lastChecked: null,
  lastCelebratedMilestone: 0,
};

function fromApi(row) {
  const last = row.last_active_date ? String(row.last_active_date).slice(0, 10) : null;
  return {
    activeDates: row.active_dates && typeof row.active_dates === 'object' ? row.active_dates : {},
    current: Number(row.current_streak) || 0,
    longest: Number(row.longest_streak) || 0,
    lastActiveDate: last,
    lastChecked: last,
    lastCelebratedMilestone: 0,
  };
}

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
  const { userId, hydrated: userHydrated } = useUser();
  const { tasks, hydrated: tasksHydrated } = useTasks();
  const dhikr = useDhikr();
  const [state, setState] = useState(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [today, setToday] = useState(() => toDayKey());
  const [celebration, setCelebration] = useState(null);
  const celebratedRef = useRef(0);
  const allowCelebration = useRef(false);
  const persistTimer = useRef(null);
  const persistReady = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userHydrated) {
        return;
      }
      if (!userId) {
        persistReady.current = false;
        setLoading(false);
        setHydrated(true);
        return;
      }
      persistReady.current = false;
      setApiUserId(userId);
      setLoading(true);
      setError(null);
      try {
        const row = await getStreak(userId);
        if (!cancelled) {
          const mapped = fromApi(row);
          celebratedRef.current = mapped.lastCelebratedMilestone || 0;
          setState({ ...EMPTY, ...mapped });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load streak from the server.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
          persistReady.current = true;
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userHydrated, userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setToday((current) => {
        const next = toDayKey();
        return current === next ? current : next;
      });
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (!hydrated || !userId || !persistReady.current) {
      return;
    }
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
    }
    persistTimer.current = setTimeout(() => {
      updateStreak(
        {
          current_streak: state.current,
          longest_streak: state.longest,
          last_active_date: state.lastActiveDate,
          active_dates: state.activeDates,
        },
        userId
      ).catch((err) => setError(err.message));
    }, 400);
    return () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
      }
    };
  }, [state, hydrated, userId]);

  const value = useMemo(
    () => ({
      current: state.current,
      longest: state.longest,
      activeDates: state.activeDates,
      lastActiveDate: state.lastActiveDate,
      celebration,
      dismissCelebration: () => setCelebration(null),
      loading,
      error,
    }),
    [state, celebration, loading, error]
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

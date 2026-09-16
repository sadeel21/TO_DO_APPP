/**
 * React concepts: Context + useEffect for persistence and a daily reset
 *
 * Counts live here so the Dhikr screen and history share one source of truth.
 * Daily totals and goals are stored in PostgreSQL (dhikr_logs + dhikr_goals).
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { DHIKR_ITEMS, defaultGoals, emptyCounts, todayKey } from '@/constants/dhikr';
import { useUser } from '@/context/UserContext';
import { getDhikrLogs, logDhikr, setApiUserId } from '@/utils/api';

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

function stateFromApi(payload) {
  const today = todayKey();
  const counts = emptyCounts();
  const history = {};
  for (const row of payload.logs || []) {
    const date = String(row.date).slice(0, 10);
    const type = row.dhikr_type;
    if (date === today) {
      counts[type] = Number(row.count) || 0;
    } else {
      if (!history[date]) {
        history[date] = emptyCounts();
      }
      history[date][type] = Number(row.count) || 0;
    }
  }
  const goals = defaultGoals();
  for (const row of payload.goals || []) {
    goals[row.dhikr_type] = Number(row.goal) || goals[row.dhikr_type];
  }
  return { date: today, counts, goals, history };
}

const DhikrContext = createContext(null);

export function DhikrProvider({ children }) {
  const { userId, hydrated: userHydrated } = useUser();
  const [state, setState] = useState(buildInitial);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userHydrated) {
        return;
      }
      if (!userId) {
        setLoading(false);
        setHydrated(true);
        return;
      }
      setApiUserId(userId);
      setLoading(true);
      setError(null);
      try {
        const payload = await getDhikrLogs(userId);
        if (!cancelled) {
          setState(rollToToday(stateFromApi(payload)));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load dhikr from the server.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
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
      setState((current) => rollToToday(current));
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo(() => {
    async function increment(id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const day = todayKey();
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
      try {
        await logDhikr({ dhikr_type: id, date: day, increment: 1 });
        setError(null);
      } catch (err) {
        setError(err.message);
        setState((current) => ({
          ...current,
          counts: {
            ...current.counts,
            [id]: Math.max(0, (current.counts[id] || 0) - 1),
          },
        }));
      }
    }

    async function reset(id) {
      const day = todayKey();
      const previous = state.counts[id] || 0;
      setState((current) => {
        const next = rollToToday(current);
        return {
          ...next,
          counts: { ...next.counts, [id]: 0 },
        };
      });
      try {
        await logDhikr({ dhikr_type: id, date: day, count: 0 });
        setError(null);
      } catch (err) {
        setError(err.message);
        setState((current) => ({
          ...current,
          counts: { ...current.counts, [id]: previous },
        }));
      }
    }

    async function setGoal(id, goal) {
      const safe = Math.max(1, Math.min(9999, Number(goal) || 1));
      const previous = state.goals[id];
      setState((current) => ({
        ...rollToToday(current),
        goals: { ...current.goals, [id]: safe },
      }));
      try {
        await logDhikr({ dhikr_type: id, goal: safe });
        setError(null);
      } catch (err) {
        setError(err.message);
        setState((current) => ({
          ...current,
          goals: { ...current.goals, [id]: previous },
        }));
      }
    }

    return {
      items: DHIKR_ITEMS,
      date: state.date,
      counts: state.counts,
      goals: state.goals,
      history: state.history,
      hydrated,
      loading,
      error,
      increment,
      reset,
      setGoal,
    };
  }, [state, hydrated, loading, error]);

  return <DhikrContext.Provider value={value}>{children}</DhikrContext.Provider>;
}

export function useDhikr() {
  const context = useContext(DhikrContext);
  if (!context) {
    throw new Error('useDhikr must be used inside DhikrProvider');
  }
  return context;
}

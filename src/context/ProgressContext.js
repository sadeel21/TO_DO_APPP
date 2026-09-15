/**
 * React concepts: Context + useEffect on app load + AsyncStorage
 *
 * XP and badges are derived from tasks / dhikr / streak, then persisted.
 * New unlocks after the first hydrate show a celebration popup.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { evaluateAchievements } from '@/constants/achievements';
import { useDhikr } from '@/context/DhikrContext';
import { useStreak } from '@/context/StreakContext';
import { useTasks } from '@/context/TaskContext';
import {
  computeTotalXp,
  countCompletedTasks,
  countDhikrGoalsReached,
  hadEarlyBird,
  levelFromXp,
} from '@/utils/xpLogic';

const STORAGE_KEY = '@todo/progress';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { tasks, hydrated: tasksHydrated } = useTasks();
  const dhikr = useDhikr();
  const { longest } = useStreak();
  const [unlocked, setUnlocked] = useState({});
  const [hydrated, setHydrated] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [celebration, setCelebration] = useState(null);
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          setUnlocked(parsed.unlocked || {});
          setTotalXp(parsed.totalXp || 0);
        }
      } catch (error) {
        console.warn('Could not load progress', error);
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

  const liveAchievements = useMemo(
    () =>
      evaluateAchievements({
        longestStreak: longest,
        completedTasks: countCompletedTasks(tasks),
        earlyBird: hadEarlyBird(tasks),
        dhikrGoals: countDhikrGoalsReached(dhikr),
      }),
    [tasks, dhikr.counts, dhikr.goals, dhikr.history, dhikr.items, longest]
  );

  const xp = useMemo(() => computeTotalXp(tasks, dhikr), [tasks, dhikr.counts, dhikr.goals, dhikr.history, dhikr.items]);

  useEffect(() => {
    if (!hydrated || !tasksHydrated || !dhikr.hydrated) {
      return;
    }

    setTotalXp((current) => (current === xp ? current : xp));

    setUnlocked((current) => {
      const next = { ...current };
      const fresh = [];
      for (const item of liveAchievements) {
        if (item.unlocked && !next[item.id]) {
          next[item.id] = true;
          fresh.push(item);
        }
      }
      if (!readyRef.current) {
        readyRef.current = true;
        return Object.keys(next).length === Object.keys(current).length ? current : next;
      }
      if (fresh[0]) {
        setTimeout(() => setCelebration(fresh[0]), 0);
      }
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [hydrated, tasksHydrated, dhikr.hydrated, xp, liveAchievements]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ totalXp, unlocked })).catch((error) => {
      console.warn('Could not save progress', error);
    });
  }, [totalXp, unlocked, hydrated]);

  const achievements = useMemo(
    () =>
      liveAchievements.map((item) => ({
        ...item,
        unlocked: item.unlocked || Boolean(unlocked[item.id]),
      })),
    [liveAchievements, unlocked]
  );

  const value = useMemo(
    () => ({
      ...levelFromXp(totalXp),
      achievements,
      celebration,
      dismissCelebration: () => setCelebration(null),
    }),
    [totalXp, achievements, celebration]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used inside ProgressProvider');
  }
  return context;
}

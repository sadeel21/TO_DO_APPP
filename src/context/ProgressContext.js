/**
 * React concepts: Context + useEffect on app load
 *
 * XP and badges are derived from tasks / dhikr / streak, then saved
 * to users + achievements_progress.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { evaluateAchievements } from '@/constants/achievements';
import { useDhikr } from '@/context/DhikrContext';
import { useStreak } from '@/context/StreakContext';
import { useTasks } from '@/context/TaskContext';
import { useUser } from '@/context/UserContext';
import { getAchievements, setApiUserId, updateAchievementProgress } from '@/utils/api';
import {
  computeTotalXp,
  countCompletedTasks,
  countDhikrGoalsReached,
  hadEarlyBird,
  levelFromXp,
} from '@/utils/xpLogic';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { userId, hydrated: userHydrated, saveProgress } = useUser();
  const { tasks, hydrated: tasksHydrated } = useTasks();
  const dhikr = useDhikr();
  const { longest } = useStreak();
  const [unlocked, setUnlocked] = useState({});
  const [progressByKey, setProgressByKey] = useState({});
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalXp, setTotalXp] = useState(0);
  const [celebration, setCelebration] = useState(null);
  const readyRef = useRef(false);
  const lastSaved = useRef('');

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
        const rows = await getAchievements(userId);
        if (cancelled) {
          return;
        }
        const nextUnlocked = {};
        const nextProgress = {};
        for (const row of rows || []) {
          nextProgress[row.achievement_key] = Number(row.progress) || 0;
          if (row.unlocked_at) {
            nextUnlocked[row.achievement_key] = true;
          }
        }
        setUnlocked(nextUnlocked);
        setProgressByKey(nextProgress);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load achievements from the server.');
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
    if (!hydrated || !userId) {
      return;
    }
    const signature = JSON.stringify({
      xp,
      unlocked,
      progress: liveAchievements.map((item) => [item.id, item.current, item.unlocked]),
    });
    if (signature === lastSaved.current) {
      return;
    }
    lastSaved.current = signature;
    const levels = levelFromXp(xp);
    saveProgress({ xp: levels.totalXp, level: levels.level }).catch(() => {});
    Promise.all(
      liveAchievements.map((item) => {
        const prev = progressByKey[item.id];
        const wasUnlocked = Boolean(unlocked[item.id]);
        if (prev === item.current && wasUnlocked === Boolean(item.unlocked)) {
          return null;
        }
        return updateAchievementProgress(
          item.id,
          {
            progress: item.current,
            unlocked_at: item.unlocked && !unlocked[item.id] ? new Date().toISOString() : null,
          },
          userId
        );
      })
    )
      .then(() => {
        setProgressByKey(Object.fromEntries(liveAchievements.map((item) => [item.id, item.current])));
        setError(null);
      })
      .catch((err) => setError(err.message));
    // progressByKey / saveProgress omitted so this cannot loop after each persist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, userId, xp, unlocked, liveAchievements]);

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
      loading,
      error,
    }),
    [totalXp, achievements, celebration, loading, error]
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

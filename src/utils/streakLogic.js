/**
 * Date / streak math — kept out of React so it is easy to test and reuse.
 *
 * Compare calendar days (YYYY-MM-DD), never raw timestamps, so opening the
 * app twice on the same day cannot double-count.
 */

export const MILESTONE_EVERY = 7;

export function toDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDay(dayKey, delta) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + delta);
  return toDayKey(next);
}

export function asDateSet(activeDates) {
  if (activeDates instanceof Set) {
    return activeDates;
  }
  return new Set(
    Object.entries(activeDates || {})
      .filter(([, on]) => Boolean(on))
      .map(([key]) => key)
  );
}

/**
 * Current streak: consecutive active days ending today, or yesterday if today
 * is still empty (the day is not "missed" until midnight). A gap before
 * yesterday means the streak is 0.
 */
export function consecutiveCurrentStreak(activeDates, today = toDayKey()) {
  const set = asDateSet(activeDates);
  let cursor = today;
  if (!set.has(today)) {
    const yesterday = shiftDay(today, -1);
    if (!set.has(yesterday)) {
      return 0;
    }
    cursor = yesterday;
  }

  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}

export function longestRun(activeDates) {
  const keys = [...asDateSet(activeDates)].sort();
  if (keys.length === 0) {
    return 0;
  }

  let best = 1;
  let run = 1;
  for (let index = 1; index < keys.length; index += 1) {
    if (keys[index] === shiftDay(keys[index - 1], 1)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function lastNDayKeys(count = 30, from = new Date()) {
  const end = toDayKey(from);
  return Array.from({ length: count }, (_, index) => shiftDay(end, -(count - 1 - index)));
}

export function weekdayIndex(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function dayNumber(dayKey) {
  return Number(dayKey.slice(-2));
}

export function isMilestone(streak) {
  return streak > 0 && streak % MILESTONE_EVERY === 0;
}

/**
 * A day is active if ≥1 task was completed that calendar day, or ≥1 dhikr
 * reached its daily goal (today’s counts or a stored history day).
 */
export function deriveActiveDates({ tasks = [], dhikr }) {
  const dates = new Set();

  for (const task of tasks) {
    if (task.completed && task.completedAt) {
      const key = toDayKey(task.completedAt);
      if (key) {
        dates.add(key);
      }
    }
  }

  if (!dhikr) {
    return dates;
  }

  const items = dhikr.items || [];
  const goals = dhikr.goals || {};

  function metGoal(counts = {}) {
    return items.some((item) => {
      const goal = goals[item.id] || item.defaultGoal || 1;
      return (counts[item.id] || 0) >= goal;
    });
  }

  if (metGoal(dhikr.counts)) {
    dates.add(dhikr.date || toDayKey());
  }

  for (const [date, counts] of Object.entries(dhikr.history || {})) {
    if (metGoal(counts)) {
      dates.add(date);
    }
  }

  return dates;
}

export function mergeDateSets(...sets) {
  const merged = new Set();
  for (const set of sets) {
    for (const key of asDateSet(set)) {
      merged.add(key);
    }
  }
  return merged;
}

export function snapshotFromDates(activeDates, previous = {}, today = toDayKey()) {
  const set = asDateSet(activeDates);
  const current = consecutiveCurrentStreak(set, today);
  const longest = Math.max(previous.longest || 0, longestRun(set), current);
  const keys = [...set].sort();
  return {
    activeDates: Object.fromEntries(keys.map((key) => [key, true])),
    current,
    longest,
    lastActiveDate: keys[keys.length - 1] || null,
    lastChecked: today,
    lastCelebratedMilestone: previous.lastCelebratedMilestone || 0,
  };
}

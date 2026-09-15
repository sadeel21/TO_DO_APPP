/**
 * XP / level math — kept out of React so screens only render numbers.
 *
 * +10 XP per completed task, +5 XP per dhikr that hit its daily goal
 * (today or a stored history day). Levels need more XP as you climb.
 */
export const XP_PER_TASK = 10;
export const XP_PER_DHIKR_GOAL = 5;

export function xpToFinishLevel(level) {
  return 100 + 25 * Math.max(0, level - 1);
}

export function levelFromXp(totalXp) {
  let remaining = Math.max(0, Math.floor(Number(totalXp) || 0));
  const stored = remaining;
  let level = 1;
  let need = xpToFinishLevel(level);

  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = xpToFinishLevel(level);
  }

  return {
    totalXp: stored,
    level,
    xpIntoLevel: remaining,
    xpToNext: need,
    percent: Math.round((remaining / need) * 100),
  };
}

export function countCompletedTasks(tasks = []) {
  return tasks.filter((task) => task.completed).length;
}

export function countDhikrGoalsReached(dhikr) {
  if (!dhikr) {
    return 0;
  }

  const items = dhikr.items || [];
  const goals = dhikr.goals || {};

  function hits(counts = {}) {
    return items.reduce((sum, item) => {
      const goal = goals[item.id] || item.defaultGoal || 1;
      return sum + ((counts[item.id] || 0) >= goal ? 1 : 0);
    }, 0);
  }

  let total = hits(dhikr.counts);
  for (const counts of Object.values(dhikr.history || {})) {
    total += hits(counts);
  }
  return total;
}

export function computeTotalXp(tasks, dhikr) {
  return countCompletedTasks(tasks) * XP_PER_TASK + countDhikrGoalsReached(dhikr) * XP_PER_DHIKR_GOAL;
}

export function hadEarlyBird(tasks = []) {
  return tasks.some((task) => {
    if (!task.completedAt) {
      return false;
    }
    return new Date(task.completedAt).getHours() < 8;
  });
}

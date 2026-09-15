/**
 * Achievement catalog + progress checks against existing app data.
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-week',
    title: 'First Week',
    description: 'Reach a 7 day streak',
    icon: '🔥',
    target: 7,
  },
  {
    id: 'century',
    title: 'Century',
    description: 'Complete 100 tasks',
    icon: '💯',
    target: 100,
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Reach a 30 day streak',
    icon: '💎',
    target: 30,
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete a task before 8am',
    icon: '🌅',
    target: 1,
  },
  {
    id: 'remembrance',
    title: 'Remembrance',
    description: 'Hit 10 dhikr daily goals',
    icon: '📿',
    target: 10,
  },
];

export function evaluateAchievements({ longestStreak = 0, completedTasks = 0, earlyBird = false, dhikrGoals = 0 }) {
  const current = {
    'first-week': longestStreak,
    century: completedTasks,
    dedicated: longestStreak,
    'early-bird': earlyBird ? 1 : 0,
    remembrance: dhikrGoals,
  };

  return ACHIEVEMENTS.map((item) => {
    const value = current[item.id] || 0;
    return {
      ...item,
      current: value,
      unlocked: value >= item.target,
      percent: Math.min(100, Math.round((value / item.target) * 100)),
    };
  });
}

/**
 * Static dhikr catalog. Counts/goals live in DhikrContext, not here.
 */
export const DHIKR_ITEMS = [
  { id: 'subhan', arabic: 'سبحان الله', translit: 'SubhanAllah', defaultGoal: 33 },
  { id: 'hamd', arabic: 'الحمد لله', translit: 'Alhamdulillah', defaultGoal: 33 },
  { id: 'akbar', arabic: 'الله أكبر', translit: 'Allahu Akbar', defaultGoal: 33 },
  { id: 'istighfar', arabic: 'أستغفر الله', translit: 'Astaghfirullah', defaultGoal: 100 },
  { id: 'tahlil', arabic: 'لا إله إلا الله', translit: 'La ilaha illallah', defaultGoal: 100 },
];

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function emptyCounts() {
  return Object.fromEntries(DHIKR_ITEMS.map((item) => [item.id, 0]));
}

export function defaultGoals() {
  return Object.fromEntries(DHIKR_ITEMS.map((item) => [item.id, item.defaultGoal]));
}

export function lastSevenKeys(from = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(from);
    day.setDate(from.getDate() - (6 - index));
    return todayKey(day);
  });
}

export function weekdayLabel(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short' });
}

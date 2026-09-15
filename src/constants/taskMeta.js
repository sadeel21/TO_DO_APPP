/**
 * Shared labels/colors for task metadata.
 * Not React state — just lookup tables used by several components.
 */
export const PRIORITIES = [
  { id: 'high', label: 'High', color: '#E11D48' },
  { id: 'medium', label: 'Medium', color: '#D97706' },
  { id: 'low', label: 'Low', color: '#059669' },
];

export const CATEGORIES = [
  { id: 'work', label: 'Work', icon: '💼', color: '#2563EB' },
  { id: 'personal', label: 'Personal', icon: '🏠', color: '#7C3AED' },
  { id: 'study', label: 'Study', icon: '📚', color: '#0D9488' },
];

export function getPriority(id) {
  return PRIORITIES.find((item) => item.id === id) ?? PRIORITIES[1];
}

export function getCategory(id) {
  return CATEGORIES.find((item) => item.id === id) ?? CATEGORIES[1];
}

export function formatDateTime(iso) {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDueDate(value) {
  if (!value) {
    return 'No due date';
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
}

export function toDateInput(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

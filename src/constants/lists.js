/**
 * Default user lists. Task.listId points at one of these (or a list the user creates).
 * This is separate from the old Work/Personal/Study *tags* on a task.
 */
export const DEFAULT_LISTS = [
  { id: 'list-work', name: 'Work' },
  { id: 'list-personal', name: 'Personal' },
  { id: 'list-study', name: 'Study' },
];

export const DEFAULT_LIST_ID = 'list-personal';

const CATEGORY_TO_LIST = {
  work: 'list-work',
  personal: 'list-personal',
  study: 'list-study',
};

export function normalizeTask(task) {
  return {
    ...task,
    listId: task.listId || CATEGORY_TO_LIST[task.category] || DEFAULT_LIST_ID,
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
  };
}

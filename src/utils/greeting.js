/**
 * Time-of-day copy — plain JS so the screen only does conditional rendering.
 */
export function timeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function remainingTodayCopy(count) {
  if (count === 1) {
    return '1 task left today';
  }
  return `${count} tasks left today`;
}

/** A task counts for "today" if it has no due date or the due date is today or earlier. */
export function isDueTodayOrOpen(task, today) {
  if (!task?.dueDate) {
    return true;
  }
  return task.dueDate <= today;
}

export function todaysTaskStats(tasks = [], today) {
  const due = tasks.filter((task) => isDueTodayOrOpen(task, today));
  const remaining = due.filter((task) => !task.completed).length;
  return {
    total: due.length,
    remaining,
    completed: due.length - remaining,
  };
}

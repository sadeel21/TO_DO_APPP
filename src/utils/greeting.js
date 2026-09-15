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

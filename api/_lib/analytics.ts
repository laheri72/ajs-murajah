export function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export function percent(completed: number, target: number) {
  if (!target) return 0;
  return Math.min(100, (completed / target) * 100);
}

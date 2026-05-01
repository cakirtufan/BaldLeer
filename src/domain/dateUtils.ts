const dayMs = 24 * 60 * 60 * 1000;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + Math.round(days));
  return date.toISOString().slice(0, 10);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T12:00:00`).getTime();
  const end = new Date(`${endIso}T12:00:00`).getTime();
  return Math.round((end - start) / dayMs);
}

export function daysFromToday(dateIso: string): number {
  return daysBetween(todayIso(), dateIso);
}

export function dateDaysAgo(daysAgo: number): string {
  return addDays(todayIso(), -daysAgo);
}

export function formatGermanDate(dateIso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${dateIso}T12:00:00`));
}

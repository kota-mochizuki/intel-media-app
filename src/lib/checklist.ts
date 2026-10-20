import type { Checklist, ListItem } from '../types';

export const allItems = (c: Checklist): ListItem[] => c.sections.flatMap((s) => s.items);

export function progress(c: Checklist, done: Record<string, boolean>) {
  const items = allItems(c);
  return { done: items.filter((i) => done[i.id]).length, total: items.length };
}

/** 2つの日付（YYYY-MM-DD）の差（日数）。dateがあとなら正 */
export const daysUntil = (date: string, today: string) =>
  Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400_000);

/** まだ終わっていない項目のうち、期限が近い順に n 個（期限のないものは最後） */
export function nextItems(c: Checklist, done: Record<string, boolean>, n = 3): ListItem[] {
  const open = allItems(c).filter((i) => !done[i.id]);
  return [...open.entries()]
    .sort(([ia, a], [ib, b]) => (a.due ?? '9999-99-99').localeCompare(b.due ?? '9999-99-99') || ia - ib)
    .slice(0, n)
    .map(([, i]) => i);
}

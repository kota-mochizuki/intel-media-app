import type { Checklist, ListItem } from '../types';

export const allItems = (c: Checklist): ListItem[] => c.sections.flatMap((s) => s.items);

export function progress(c: Checklist, done: Record<string, boolean>) {
  const items = allItems(c);
  return { done: items.filter((i) => done[i.id]).length, total: items.length };
}

/** 2つの日付（YYYY-MM-DD）の差（日数）。dateがあとなら正 */
export const daysUntil = (date: string, today: string) =>
  Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400_000);

/** 時期が来た項目：まだ終わっていなくて、期限まで days 日以内（過ぎたものも含む）。期限が近い順。期限のない項目は出さない */
export function dueSoon(c: Checklist, done: Record<string, boolean>, today: string, days = 7): ListItem[] {
  return allItems(c).filter((i) => !done[i.id] && i.due && daysUntil(i.due, today) <= days).sort((a, b) => a.due!.localeCompare(b.due!));
}

/** まだ終わっていない項目のうち、期限が近い順に n 個（期限のないものは最後） */
export function nextItems(c: Checklist, done: Record<string, boolean>, n = 3): ListItem[] {
  const open = allItems(c).filter((i) => !done[i.id]);
  return [...open.entries()]
    .sort(([ia, a], [ib, b]) => (a.due ?? '9999-99-99').localeCompare(b.due ?? '9999-99-99') || ia - ib)
    .slice(0, n)
    .map(([, i]) => i);
}

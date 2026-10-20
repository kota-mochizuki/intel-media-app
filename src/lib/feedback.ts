import type { Feedback, ItemFeedback } from '../types';

export const emptyFeedback = (id: string): Feedback => ({ id, read: false, items: {}, updatedAt: new Date(0).toISOString() });

export function setItem(fb: Feedback, itemId: string, patch: ItemFeedback): Feedback {
  return { ...fb, items: { ...fb.items, [itemId]: { ...fb.items[itemId], ...patch } } };
}

export const starCount = (fb: Feedback | null) => (fb ? Object.values(fb.items).filter((i) => i.star).length : 0);

/** 既読の記録が始まってから、読んでいない配信（今日の分は数えない） */
export function unreadIds(ids: string[], fbs: Record<string, Feedback | null>, today: string): string[] {
  const recorded = ids.filter((id) => fbs[id]);
  if (!recorded.length) return [];
  const first = recorded.sort()[0];
  return ids.filter((id) => id >= first && id < today && !fbs[id]?.read);
}

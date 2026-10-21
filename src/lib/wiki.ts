import type { WikiIndexItem } from '../types';

export const SUBJECTS = [
  { id: 'finance', name: '金融' }, { id: 'realestate', name: '不動産' }, { id: 'life', name: 'ライフ' },
  { id: 'risk', name: 'リスク' }, { id: 'tax', name: 'タックス' }, { id: 'inheritance', name: '相続' },
] as const;
export const SUBJECT_NAME: Record<string, string> = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.name]));
export const WIKI_TOTAL = 427; // wiki/plan.json の中分類の数

/** 検索：見出し・中分類・大分類・要約のどれかに、空白で区切った語がすべて含まれるもの */
export function searchWiki(list: WikiIndexItem[], q: string, subject: string | null): WikiIndexItem[] {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((e) => (!subject || e.subject === subject) && words.every((w) => `${e.title} ${e.middle} ${e.large} ${e.summary}`.toLowerCase().includes(w)));
}

/** 今朝届いた項目（夜中に書かれた＝作成日が今日） */
export const newToday = (list: WikiIndexItem[], today: string) => list.filter((e) => e.created === today);

import type { ChecksState, StudyBook, StudyItem, StudyScore } from '../types';

export const scoreKey = (book: string, no: number) => `${book}-${no}`;
const lastQ = (it: StudyItem) => it.first + it.stars.length - 1;

/** 大問が終わっているか（記録あり、または最初に申告した「ここまで」の範囲） */
export const isDone = (st: ChecksState, book: StudyBook, it: StudyItem) =>
  Boolean(st.scores?.[scoreKey(book.id, it.no)]) || it.no <= (st.seeds?.[book.id]?.upTo ?? 0);

/** 取り組む本：順番のうち、まだ終わっていない大問がある最初の本 */
export function currentBook(books: StudyBook[], order: string[], st: ChecksState): StudyBook | null {
  for (const id of order) { const b = books.find((x) => x.id === id); if (b && b.items.some((it) => !isDone(st, b, it))) return b; }
  return null;
}

/** 今日の範囲：今日記録した大問＋まだの大問を、設問数が目安に届くまで（大問の途中では切らない） */
export function todaySet(book: StudyBook, st: ChecksState, today: string, target: number): StudyItem[] {
  const out = book.items.filter((it) => st.scores?.[scoreKey(book.id, it.no)]?.d === today);
  let n = out.reduce((s, it) => s + it.stars.length, 0);
  for (const it of book.items) {
    if (n >= target) break;
    if (isDone(st, book, it)) continue;
    out.push(it); n += it.stars.length;
  }
  return out.sort((a, b) => a.no - b.no);
}

export const rangeLabel = (items: StudyItem[]) => items.length ? `問${items[0].no}〜問${items[items.length - 1].no}（設問${items[0].first}〜${lastQ(items[items.length - 1])}）` : '';

/** 本の進み具合：終わった設問数・正答（申告分を含む） */
export function progress(book: StudyBook, st: ChecksState) {
  const total = book.items.reduce((s, it) => s + it.stars.length, 0);
  const seed = st.seeds?.[book.id];
  let done = seed?.n ?? 0, c = seed?.c ?? 0;
  for (const it of book.items) { const sc = st.scores?.[scoreKey(book.id, it.no)]; if (sc && it.no > (seed?.upTo ?? 0)) { done += sc.n; c += sc.c; } }
  return { total, done, c };
}

/** 分野ごとの正答率（記録した大問だけ）。重み＝★の合計。復習の候補＝正答率70%未満 */
export function byTopic(book: StudyBook, st: ChecksState) {
  const m = new Map<string, { topic: string; c: number; n: number; stars: number; items: number[] }>();
  for (const it of book.items) {
    const sc: StudyScore | undefined = st.scores?.[scoreKey(book.id, it.no)];
    if (!sc) continue;
    const r = m.get(it.topic) ?? { topic: it.topic, c: 0, n: 0, stars: 0, items: [] };
    r.c += sc.c; r.n += sc.n; r.stars += it.stars.reduce((a, b) => a + b, 0); r.items.push(it.no);
    m.set(it.topic, r);
  }
  return [...m.values()].map((r) => ({ ...r, rate: r.n ? r.c / r.n : 0, review: r.n > 0 && r.c / r.n < 0.7 }))
    .sort((a, b) => Number(b.review) - Number(a.review) || a.rate - b.rate || b.stars - a.stars);
}

/** 1日の目安の設問数：締切（その本の until）までに、残りを日割り。今日記録した分は「残り」に戻して計算する（1日の中で目安が変わらないように）。締切がない・過ぎたら既定値 */
export function dailyTarget(book: StudyBook, st: ChecksState, today: string, until: string | undefined, fallback: number): number {
  if (!until || today > until) return fallback;
  const days = Math.round((Date.parse(until) - Date.parse(today)) / 86_400_000) + 1;
  const left = book.items.filter((it) => !isDone(st, book, it) || st.scores?.[scoreKey(book.id, it.no)]?.d === today).reduce((s, it) => s + it.stars.length, 0);
  return Math.max(1, Math.ceil(left / days));
}

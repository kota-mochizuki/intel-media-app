import type { Issue } from '../types';

// 曜日ごとのテーマと色（PROMPT.md 第19節）。0=日
export const THEMES = [
  { name: '読み物', hue: 'sun' }, { name: '仕事の最新', hue: 'mon' }, { name: 'お金と暮らし', hue: 'tue' },
  { name: '体と健康', hue: 'wed' }, { name: 'AIと未来', hue: 'thu' }, { name: '週末の遊び', hue: 'fri' }, { name: '深掘り', hue: 'sat' },
] as const;
const WD = ['日', '月', '火', '水', '木', '金', '土'];

/** その日付の曜日（端末のタイムゾーンに左右されない） */
export const weekday = (id: string) => new Date(id + 'T00:00:00Z').getUTCDay();
export const themeOf = (id: string) => THEMES[weekday(id)];
export const todayJst = (now = Date.now()) => new Date(now + 9 * 3600_000).toISOString().slice(0, 10);
export const formatDate = (id: string) => `${Number(id.slice(5, 7))}月${Number(id.slice(8, 10))}日（${WD[weekday(id)]}）`;
export const monthLabel = (id: string) => `${id.slice(0, 4)}年${Number(id.slice(5, 7))}月`;

/** 読了の目安（分）。日本語は1分あたり約500字で計算 */
export function readMinutes(issue: Issue): number {
  const chars = (issue.note?.length ?? 0) + (issue.bonus?.body.length ?? 0) +
    issue.items.reduce((n, it) => n + it.title.length + it.insight.text.length + (it.points ?? []).join('').length + it.why.length + (it.action?.length ?? 0) + (it.points ? 0 : (it.summary ?? '').length), 0);
  return Math.max(1, Math.round(chars / 500));
}

/** 夜の振り返りの日付。日付が変わっても朝4時までは前の日の振り返りとして扱う */
export const reflectionDay = (now = Date.now()) => todayJst(now - 4 * 3600_000);

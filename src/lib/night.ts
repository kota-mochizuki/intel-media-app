// 夜の振り返りの問い。定款のバリュー・経営ルールから、進みたい方向に進めているかを2択で確かめる。
export interface NightQuestion { id: string; short: string; text: string; from: string; until?: string }
// 本人の言葉（定款のバリュー・3つの問い・株主総会の問い）をそのまま日々の問いにする（2026-10-21 CEO が選択）。
// アプリがすでに知っていること（過去問の記録・入籍リストのチェック）は聞かない
export const NIGHT_QUESTIONS: NightQuestion[] = [
  { id: 'lead', short: '主導権', text: '今日、自分で選んで時間を使えた', from: 'バリュー1 人生の主導権を握る' },
  { id: 'sincere', short: '言行一致', text: '言ったことと、やったことが一致していた', from: '株主総会の問い② 信頼' },
  { id: 'help', short: '役に立つ', text: '誰かの役に立つことをした', from: 'バリュー7 自分の力を人のために' },
  { id: 'absorb', short: '夢中', text: '夢中になれた時間があった', from: 'バリュー3 夢中になって一日を使い切る' },
  { id: 'noregret', short: '後悔なし', text: '今日の自分に、後悔はない', from: '迷ったときの3つの問い①' },
];

/** その日に答える問い（期限つきの問いは期限の日まで） */
export const questionsFor = (day: string) => NIGHT_QUESTIONS.filter((x) => !x.until || day <= x.until);

/** 直近の日付（新しい順）。today を含めて n 日 */
export function lastDays(today: string, n: number): string[] {
  const t = Date.parse(today + 'T00:00:00Z');
  return Array.from({ length: n }, (_, i) => new Date(t - i * 86_400_000).toISOString().slice(0, 10));
}

/** 問いごとの「できた」の数と、答えた日数 */
export function tally(qs: (Record<string, boolean> | undefined)[], list: NightQuestion[] = NIGHT_QUESTIONS) {
  return Object.fromEntries(list.map((x) => {
    const a = qs.filter((q) => q?.[x.id] !== undefined);
    return [x.id, { yes: a.filter((q) => q![x.id]).length, answered: a.length }];
  })) as Record<string, { yes: number; answered: number }>;
}

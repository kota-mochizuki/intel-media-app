// 夜の振り返りの問い。定款のバリュー・経営ルールから、進みたい方向に進めているかを2択で確かめる。
// id は記録のキーなので変えない（文言は変えてよい）
export const NIGHT_QUESTIONS = [
  { id: 'lead', short: '主導権', text: '今日は、自分で選んだ1日だった', from: 'バリュー1 人生の主導権を握る' },
  { id: 'step', short: '前進', text: '今期の重点に、1歩でも進んだ', from: 'CFP・入籍後の生活・紹介ネットワーク' },
  { id: 'body', short: '体', text: '体を大事にできた', from: '健康事業部（療養中は無理をしない）' },
  { id: 'people', short: '人', text: '大切な人・約束を大事にできた', from: 'バリュー4〜6 家族・信頼' },
  { id: 'yohaku', short: '余白', text: '余白の時間（サウナ・読書・ゲームなど）をとれた', from: '経営ルール6 週3.5時間' },
] as const;

/** 直近の日付（新しい順）。today を含めて n 日 */
export function lastDays(today: string, n: number): string[] {
  const t = Date.parse(today + 'T00:00:00Z');
  return Array.from({ length: n }, (_, i) => new Date(t - i * 86_400_000).toISOString().slice(0, 10));
}

/** 問いごとの「できた」の数と、答えた日数 */
export function tally(qs: (Record<string, boolean> | undefined)[]) {
  return Object.fromEntries(NIGHT_QUESTIONS.map((x) => {
    const a = qs.filter((q) => q?.[x.id] !== undefined);
    return [x.id, { yes: a.filter((q) => q![x.id]).length, answered: a.length }];
  })) as Record<string, { yes: number; answered: number }>;
}

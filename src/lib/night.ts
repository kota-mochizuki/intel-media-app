// 夜の振り返りの問い。定款のバリュー・経営ルールから、進みたい方向に進めているかを2択で確かめる。
// 本人の今の生活に合わせた具体的な問い（2026-10-21）。id は記録のキーなので変えない（文言は変えてよい）。療養が終わったら knee を運動の問いに差し替える
export interface NightQuestion { id: string; short: string; text: string; from: string; until?: string }
export const NIGHT_QUESTIONS: NightQuestion[] = [
  { id: 'cfp', short: 'CFP', text: 'CFPの過去問に取り組んだ（紙・FPK）', from: '重点① CFP合格' },
  { id: 'nyuseki', short: '入籍', text: '入籍の準備を1つ進めた', from: '重点② 入籍後の生活', until: '2026-11-22' },
  { id: 'referral', short: '紹介', text: '紹介元やお客様との関係に、1つ手を打てた（連絡・お礼・提案）', from: '重点③ 紹介ネットワーク' },
  { id: 'partner', short: 'パートナー', text: 'パートナーとゆっくり過ごす・話す時間をとれた', from: '最低ライン（パートナー）' },
  { id: 'knee', short: '膝', text: '膝をいたわれた（痛みが出ることをしなかった）', from: '療養モード' },
  { id: 'phone', short: 'スマホ', text: 'YouTube・スマホに流されず、遊びは決めた分で止められた', from: 'スクリーンタイム 1日約6時間' },
  { id: 'yohaku', short: '余白', text: 'サウナ・読書・ゲームの時間をとれた', from: '経営ルール6 週3.5時間' },
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

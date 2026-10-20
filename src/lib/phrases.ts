// 日本語を文節（意味のまとまり）に分ける。改行は文節の切れ目だけで起こす（単語や「〜のは」を分断しない）
// 参考：伝わるデザイン「箇条書きと段落」（改行の位置）
import { Parser } from 'budoux-lite/parser';
import { model } from 'budoux-lite/ja';

const parser = new Parser(model);
const CLOSE = /^[、。，．：；）」』】〕！？・ー…%％]/; // 行頭に来てはいけない文字
const OPEN_END = /[「『（【〔]+$/; // 行末に来てはいけない文字（開き括弧は次の文節の頭へ）
const QUOTE_MAX = 12; // かぎ括弧の中がこの字数までなら、1つのまとまりとして改行しない

/** BudouX の分け方を、行頭禁則・1文字だけの行・かぎ括弧のまとまりに合わせて整える */
export function tidy(raw: string[]): string[] {
  // 1) 「：」「、」の直後で分ける（「血液量：早期に」→「血液量：」「早期に」）。狭い列で句読点が行頭に出ないように
  const split = raw.flatMap((p) => p.split(/(?<=[：、，])(?=.{2,})/).filter(Boolean));
  // 1.5) 文節の末尾に開き括弧が付いていたら、次の文節の頭に移す
  //      （「（」だけの文節も同じ。1文字の文節を前につなぐ規則より先に処理する）
  for (let i = 0; i + 1 < split.length; i++) {
    const m = split[i].match(OPEN_END);
    if (m) { split[i] = split[i].slice(0, -m[0].length); split[i + 1] = m[0] + split[i + 1]; }
  }
  const out: string[] = [];
  for (const p of split.filter(Boolean)) {
    const prev = out.at(-1);
    // 2) 句読点・閉じ括弧で始まる文節、1文字だけの文節、数字の途中で切れた文節（「機関5｜9%」）は、前の文節につなぐ
    const midNumber = prev !== undefined && /[0-9０-９][.,．，]?$/.test(prev) && /^[.,．，]?[0-9０-９%％]/.test(p);
    if (prev !== undefined && (CLOSE.test(p) || p.length === 1 || midNumber)) out[out.length - 1] = prev + p;
    else out.push(p);
  }
  // 3) かぎ括弧の中が短ければ、開きから閉じまでを1つにまとめる（「週の｜所定労働時間」と → 1つ）
  const merged: string[] = [];
  for (let i = 0; i < out.length; i++) {
    let cur = out[i];
    if (cur.includes('「') && !cur.includes('」')) {
      let j = i, acc = cur;
      while (j + 1 < out.length && !acc.includes('」') && acc.length + out[j + 1].length <= QUOTE_MAX + 4) acc += out[++j];
      if (acc.includes('」')) { cur = acc; i = j; }
    }
    merged.push(cur);
  }
  return merged;
}

export const phrases = (text: string): string[] => (text ? tidy(parser.parse(text)) : []);

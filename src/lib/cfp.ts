// CFP学習アプリ（cfp-study）の講義と進み具合を読む。どちらも公開データ（書き込みはしない）。
// 講義＝cfp-study の lectures ブランチ、解いた問題数＝CFPアプリが Firestore に公開している answered。
import * as store from './store';

const RAW = 'https://raw.githubusercontent.com/kota-mochizuki/cfp-study/lectures/lectures';
const PROGRESS = 'https://firestore.googleapis.com/v1/projects/cfp-study-1b5a8/databases/(default)/documents/progress';
export const CFP_APP = 'https://kota-mochizuki.github.io/cfp-study/';
export const EXAM_DAY = '2027-06-13';

export const SUBJECT_SHORT: Record<string, string> = { finance: '金融', realestate: '不動産', life: 'ライフ', risk: 'リスク', tax: 'タックス', inheritance: '相続' };

export interface CfpLecture { id: string; date: string; subject: string; title: string; minutes: number; questions: number }
export interface CfpState { delivered: CfpLecture[]; total: number; totals: Record<string, number>; answered: Record<string, number>; progressAt: string | null }

const K = 'imc:cfp';
export const cachedCfp = () => store.get<CfpState>(K);

export async function fetchCfp(): Promise<CfpState> {
  const get = async (u: string) => { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error(`CFPのデータを読めません（${r.status}）`); return r.json(); };
  const [index, cur, prog] = await Promise.all([get(`${RAW}/index.json`), get(`${RAW}/curriculum.json`), get(PROGRESS).catch(() => null)]);
  const qs = new Map<string, number>((cur.lectures as { id: string; questions: number }[]).map((l) => [l.id, l.questions]));
  const totals: Record<string, number> = {};
  for (const l of cur.lectures as { subject: string }[]) totals[l.subject] = (totals[l.subject] ?? 0) + 1;
  const docs = (prog?.documents ?? []) as { fields: { json: { stringValue: string }; updatedAt?: { timestampValue: string } } }[];
  docs.sort((a, b) => ((a.fields.updatedAt?.timestampValue ?? '') < (b.fields.updatedAt?.timestampValue ?? '') ? 1 : -1));
  const s: CfpState = {
    delivered: (index as Omit<CfpLecture, 'questions'>[]).map((l) => ({ ...l, questions: qs.get(l.id) ?? 3 })),
    total: cur.lectures.length,
    totals,
    answered: docs[0] ? (JSON.parse(docs[0].fields.json.stringValue).answered ?? {}) : {},
    progressAt: docs[0]?.fields.updatedAt?.timestampValue ?? null,
  };
  store.set(K, s);
  return s;
}

/** 解き終えた＝確認問題をすべて回答した講義 */
export const isDone = (s: CfpState, l: CfpLecture) => (s.answered[l.id] ?? 0) >= l.questions;

export function summarize(s: CfpState) {
  const open = s.delivered.filter((l) => !isDone(s, l)).sort((a, b) => a.id.localeCompare(b.id));
  const done = s.delivered.filter((l) => isDone(s, l)).sort((a, b) => b.id.localeCompare(a.id));
  const doneBy: Record<string, number> = {};
  for (const l of done) doneBy[l.subject] = (doneBy[l.subject] ?? 0) + 1;
  return { open, done, doneBy };
}

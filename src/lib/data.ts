// 配信の読み込みとフィードバックの保存。
// データは非公開リポジトリ（intel-media-data）に置き、端末に保存したトークンで GitHub API から読み書きする。
// ?demo を付けると、手元の public/demo/ を読む（公開版には含まれない）。
import type { Brief, Checklist, ChecksState, Feedback, Issue } from '../types';
import { emptyFeedback } from './feedback';
import { fromB64, toB64 } from './b64';
import * as store from './store';

const P = 'imc:';
export interface Config { owner: string; repo: string; token: string }
export const DEFAULT_CONFIG: Config = { owner: 'kota-mochizuki', repo: 'intel-media-data', token: '' };

export const isDemo = () => new URLSearchParams(location.search).has('demo');
export const loadConfig = (): Config => ({ ...DEFAULT_CONFIG, ...store.get<Partial<Config>>(P + 'config') });
export const saveConfig = (c: Config) => store.set(P + 'config', c);
export const isConfigured = () => isDemo() || Boolean(loadConfig().token);
export const clearDevice = () => store.clearAll(P);

export class HttpError extends Error {
  constructor(public status: number) { super(status === 401 ? 'トークンが正しくないか、期限切れです' : status === 404 ? '見つかりません（リポジトリ名かトークンの権限を確認してください）' : `通信エラー（${status}）`); }
}

async function gh(path: string, init: RequestInit = {}, raw = false): Promise<Response> {
  const c = loadConfig();
  return fetch(`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      Authorization: `Bearer ${c.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {}),
    },
  });
}

// ---- 配信 ----
export const cachedIds = () => store.get<string[]>(P + 'ids') ?? [];
export const cachedIssue = (id: string) => store.get<Issue>(P + 'issue:' + id);

/** 配信の日付一覧（新しい順） */
export async function fetchIds(): Promise<string[]> {
  let ids: string[];
  if (isDemo()) ids = await (await fetch('./demo/index.json', { cache: 'no-store' })).json();
  else {
    const res = await gh('issues');
    if (res.status === 404) ids = []; // まだ1本も配信がない
    else if (!res.ok) throw new HttpError(res.status);
    else ids = ((await res.json()) as { name: string }[]).map((f) => f.name).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).map((n) => n.slice(0, 10));
  }
  ids.sort().reverse();
  store.set(P + 'ids', ids);
  return ids;
}

export async function fetchIssue(id: string): Promise<Issue> {
  const res = isDemo() ? await fetch(`./demo/issues/${id}.json`, { cache: 'no-store' }) : await gh(`issues/${id}.json`, {}, true);
  if (!res.ok) throw new HttpError(res.status);
  const issue = (await res.json()) as Issue;
  store.set(P + 'issue:' + id, issue);
  return issue;
}

// ---- 秘書の朝の報告（なければ null）----
export const cachedBriefIds = () => store.get<string[]>(P + 'briefIds') ?? [];
/** 報告の日付一覧（新しい順） */
export async function fetchBriefIds(): Promise<string[]> {
  let ids: string[];
  if (isDemo()) {
    const r = await fetch('./demo/briefs/index.json', { cache: 'no-store' });
    ids = r.ok ? await r.json() : [];
  } else {
    const res = await gh('briefs');
    if (res.status === 404) ids = [];
    else if (!res.ok) throw new HttpError(res.status);
    else ids = ((await res.json()) as { name: string }[]).map((f) => f.name).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).map((n) => n.slice(0, 10));
  }
  ids.sort().reverse();
  store.set(P + 'briefIds', ids);
  return ids;
}
export const cachedBrief = (id: string) => store.get<Brief>(P + 'brief:' + id);
export async function fetchBrief(id: string): Promise<Brief | null> {
  const res = isDemo() ? await fetch(`./demo/briefs/${id}.json`, { cache: 'no-store' }) : await gh(`briefs/${id}.json`, {}, true);
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(res.status);
  const b = (await res.json()) as Brief;
  store.set(P + 'brief:' + id, b);
  return b;
}

// ---- フィードバック ----
interface FbRecord { data: Feedback; sha?: string; dirty: boolean }
const fbKey = (id: string) => P + 'fb:' + id;
export const localFeedback = (id: string) => store.get<FbRecord>(fbKey(id))?.data ?? null;

/** 端末の控えを返し、送っていない変更がなければ GitHub の最新で上書きする */
export async function loadFeedback(id: string): Promise<Feedback> {
  const rec = store.get<FbRecord>(fbKey(id));
  if (rec?.dirty || isDemo()) return rec?.data ?? emptyFeedback(id);
  const res = await gh(`feedback/${id}.json`);
  if (res.status === 404) return rec?.data ?? emptyFeedback(id);
  if (!res.ok) throw new HttpError(res.status);
  const body = (await res.json()) as { content: string; sha: string };
  const data = { ...emptyFeedback(id), ...(JSON.parse(fromB64(body.content)) as Feedback) };
  store.set(fbKey(id), { data, sha: body.sha, dirty: false } satisfies FbRecord);
  return data;
}

export function saveFeedbackLocal(fb: Feedback): void {
  const rec = store.get<FbRecord>(fbKey(fb.id));
  store.set(fbKey(fb.id), { data: fb, sha: rec?.sha, dirty: true } satisfies FbRecord);
}

export type SaveState = 'saved' | 'queued';

/** 送っていない変更を GitHub に送る。電波がない・失敗したときは控えに残して、次の機会に送る */
export async function flushFeedback(id: string): Promise<SaveState> {
  const rec = store.get<FbRecord>(fbKey(id));
  if (!rec?.dirty) return 'saved';
  if (isDemo()) { store.set(fbKey(id), { ...rec, dirty: false }); return 'saved'; }
  if (!navigator.onLine) return 'queued';
  const put = (sha?: string) => gh(`feedback/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ message: `フィードバック ${id}`, content: toB64(JSON.stringify(rec.data, null, 2) + '\n'), ...(sha ? { sha } : {}) }),
  });
  try {
    let res = await put(rec.sha);
    if (res.status === 409 || res.status === 422) {
      // 別の端末で先に保存されていた：最新の sha を取り直して、この端末の内容で上書きする
      const cur = await gh(`feedback/${id}.json`);
      res = await put(cur.ok ? ((await cur.json()) as { sha: string }).sha : undefined);
    }
    if (!res.ok) return 'queued';
    const sha = ((await res.json()) as { content: { sha: string } }).content.sha;
    const latest = store.get<FbRecord>(fbKey(id));
    // 送っている間に新しい入力があれば、未送信のまま残す
    store.set(fbKey(id), { data: latest?.data ?? rec.data, sha, dirty: latest ? latest.data.updatedAt !== rec.data.updatedAt : false });
    return 'saved';
  } catch { return 'queued'; }
}

export async function flushAll(): Promise<void> {
  for (const k of store.keys(P + 'fb:')) await flushFeedback(k.slice((P + 'fb:').length));
  for (const k of store.keys(P + 'ck:')) await flushChecks(k.slice((P + 'ck:').length));
}

/** 過去の一覧用：端末にある既読の記録（なければ null） */
export const feedbackMap = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, localFeedback(id)]));

// ---- やることリスト ----
export const cachedListIds = () => store.get<string[]>(P + 'listIds') ?? [];
export const cachedList = (id: string) => store.get<Checklist>(P + 'list:' + id);

export async function fetchListIds(): Promise<string[]> {
  let ids: string[];
  if (isDemo()) {
    const r = await fetch('./demo/lists/index.json', { cache: 'no-store' });
    ids = r.ok ? await r.json() : [];
  } else {
    const res = await gh('lists');
    if (res.status === 404) ids = [];
    else if (!res.ok) throw new HttpError(res.status);
    else ids = ((await res.json()) as { name: string }[]).map((f) => f.name).filter((n) => n.endsWith('.json')).map((n) => n.slice(0, -5));
  }
  store.set(P + 'listIds', ids);
  return ids;
}

export async function fetchList(id: string): Promise<Checklist> {
  const res = isDemo() ? await fetch(`./demo/lists/${id}.json`, { cache: 'no-store' }) : await gh(`lists/${id}.json`, {}, true);
  if (!res.ok) throw new HttpError(res.status);
  const l = (await res.json()) as Checklist;
  store.set(P + 'list:' + id, l);
  return l;
}

// チェックの状態（checks/<名前>.json）。入力はすぐ端末に控え、あとで GitHub に送る
const emptyChecks = (id: string): ChecksState => ({ id, done: {}, updatedAt: new Date(0).toISOString() });
const ckKey = (id: string) => P + 'ck:' + id;
export const localChecks = (id: string) => store.get<FbRecord2>(ckKey(id))?.data ?? null;
interface FbRecord2 { data: ChecksState; sha?: string; dirty: boolean }

export async function loadChecks(id: string): Promise<ChecksState> {
  const rec = store.get<FbRecord2>(ckKey(id));
  if (rec?.dirty || isDemo()) return rec?.data ?? emptyChecks(id);
  const res = await gh(`checks/${id}.json`);
  if (res.status === 404) return rec?.data ?? emptyChecks(id);
  if (!res.ok) throw new HttpError(res.status);
  const body = (await res.json()) as { content: string; sha: string };
  const data = { ...emptyChecks(id), ...(JSON.parse(fromB64(body.content)) as ChecksState) };
  store.set(ckKey(id), { data, sha: body.sha, dirty: false } satisfies FbRecord2);
  return data;
}

export function saveChecksLocal(st: ChecksState): void {
  const rec = store.get<FbRecord2>(ckKey(st.id));
  store.set(ckKey(st.id), { data: st, sha: rec?.sha, dirty: true } satisfies FbRecord2);
}

export async function flushChecks(id: string): Promise<SaveState> {
  const rec = store.get<FbRecord2>(ckKey(id));
  if (!rec?.dirty) return 'saved';
  if (isDemo()) { store.set(ckKey(id), { ...rec, dirty: false }); return 'saved'; }
  if (!navigator.onLine) return 'queued';
  const put = (sha?: string) => gh(`checks/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ message: `チェック ${id}`, content: toB64(JSON.stringify(rec.data, null, 2) + '\n'), ...(sha ? { sha } : {}) }),
  });
  try {
    let res = await put(rec.sha);
    if (res.status === 409 || res.status === 422) {
      const cur = await gh(`checks/${id}.json`);
      res = await put(cur.ok ? ((await cur.json()) as { sha: string }).sha : undefined);
    }
    if (!res.ok) return 'queued';
    const sha = ((await res.json()) as { content: { sha: string } }).content.sha;
    const latest = store.get<FbRecord2>(ckKey(id));
    store.set(ckKey(id), { data: latest?.data ?? rec.data, sha, dirty: latest ? latest.data.updatedAt !== rec.data.updatedAt : false });
    return 'saved';
  } catch { return 'queued'; }
}

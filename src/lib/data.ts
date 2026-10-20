// 配信の読み込みとフィードバックの保存。
// データは非公開リポジトリ（intel-media-data）に置き、端末に保存したトークンで GitHub API から読み書きする。
// ?demo を付けると、手元の public/demo/ を読む（公開版には含まれない）。
import type { Feedback, Issue } from '../types';
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
}

/** 過去の一覧用：端末にある既読の記録（なければ null） */
export const feedbackMap = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, localFeedback(id)]));

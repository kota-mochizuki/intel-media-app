import { useEffect, useState } from 'react';
import type { WikiEntry, WikiIndexItem } from '../types';
import { cachedWikiEntry, cachedWikiIndex, fetchWikiEntry, fetchWikiIndex } from '../lib/data';
import { SUBJECTS, SUBJECT_NAME, WIKI_TOTAL, searchWiki } from '../lib/wiki';
import { Inline, RichText } from './RichText';

export function useWikiIndex() {
  const [list, setList] = useState<WikiIndexItem[]>(cachedWikiIndex);
  useEffect(() => {
    let off = false;
    fetchWikiIndex().then((x) => { if (!off) setList(x); }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, []);
  return list;
}

/** 「辞書」タブ：FP辞書の検索と一覧 */
export function WikiView() {
  const list = useWikiIndex();
  const [q, setQ] = useState('');
  const [sub, setSub] = useState<string | null>(null);
  const hits = searchWiki(list, q, sub);
  return (
    <div className="wikiview">
      <header className="masthead masthead-brief">
        <div className="masthead-date">FP辞書</div>
        <div className="masthead-row"><span className="theme">{list.length} / {WIKI_TOTAL} 項目</span><span className="muted small">毎晩3項目ずつ増えます</span></div>
      </header>
      <input className="wiki-search" type="search" placeholder="調べたい言葉（例：一時所得、小規模宅地）" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="wiki-subs">
        <button className={!sub ? 'on' : ''} onClick={() => setSub(null)}>すべて</button>
        {SUBJECTS.map((s) => <button key={s.id} className={sub === s.id ? 'on' : ''} onClick={() => setSub(sub === s.id ? null : s.id)}>{s.name}</button>)}
      </div>
      {list.length === 0 ? <p className="muted">まだ項目がありません。今夜0時から書き始めます。</p>
        : hits.length === 0 ? <p className="muted">見つかりませんでした。</p>
        : <ul className="cfp-list">{hits.map((e) => <WikiRow key={e.id} e={e} />)}</ul>}
    </div>
  );
}

export function WikiRow({ e }: { e: WikiIndexItem }) {
  return (
    <li>
      <a href={`#/wiki/${e.id}`}>
        <span className="cfp-title">{e.title}</span>
        <span className="muted small">{SUBJECT_NAME[e.subject]}・{e.middle}{e.pickup ? `・★${e.pickup.type}` : ''}</span>
      </a>
    </li>
  );
}

/** 1項目の画面 */
export function WikiEntryView({ id }: { id: string }) {
  const [e, setE] = useState<WikiEntry | null>(() => cachedWikiEntry(id));
  const [error, setError] = useState<string | null>(null);
  const list = useWikiIndex();
  useEffect(() => {
    let off = false;
    fetchWikiEntry(id).then((x) => { if (!off) setE(x); }).catch((x: Error) => { if (!off) setError(x.message); });
    return () => { off = true; };
  }, [id]);
  if (!e) return error ? <section className="card welcome"><p>{error}</p></section> : <div className="sk sk-card" />;
  const rel = (e.related ?? []).map((r) => list.find((x) => x.id === r)).filter(Boolean) as WikiIndexItem[];
  return (
    <article className="wiki-entry">
      <p className="small"><a href="#/wiki">← 辞書</a></p>
      <div className="muted small">{SUBJECT_NAME[e.subject]}・{e.large}</div>
      <h1 className="wiki-title">{e.title}</h1>
      <p className="wiki-summary"><Inline text={e.summary} /></p>
      {e.pickup && (
        <section className="card pickup">
          <div className="label">★ {e.pickup.type}</div>
          <h3>{e.pickup.title}</h3>
          {e.pickup.text && <p><Inline text={e.pickup.text} /></p>}
          {e.pickup.source && <p className="small"><a href={e.pickup.source.url} target="_blank" rel="noreferrer">{e.pickup.source.title}</a><span className="muted">（{e.pickup.source.publisher}{e.pickup.date ? `・${e.pickup.date}` : ''}）</span></p>}
        </section>
      )}
      {e.sections.map((s, i) => <section key={i} className="wiki-sec"><h2>{s.heading}</h2><RichText text={s.text} /></section>)}
      {e.numbers?.length ? (
        <section className="card"><div className="label">数値（2027年1月1日時点）</div>
          <ul className="wiki-nums">{e.numbers.map((n, i) => <li key={i}><span>{n.label}</span><b>{n.value}</b>{n.note && <span className="muted small">{n.note}</span>}</li>)}</ul></section>
      ) : null}
      <section className="card"><div className="label">お客様に話すなら</div><RichText text={e.talk} /></section>
      <section className="card"><div className="label">試験での注意</div><RichText text={e.exam} /></section>
      {rel.length > 0 && <section><h3 className="sec">関連する項目</h3><ul className="cfp-list">{rel.map((r) => <WikiRow key={r.id} e={r} />)}</ul></section>}
      {e.unconfirmed?.length ? <p className="muted small">未確認：{e.unconfirmed.join('／')}</p> : null}
      <details className="fold"><summary>出典（{e.sources.length}）</summary>
        <ul className="brief-list">{e.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a><span className="muted small">（{s.publisher}{s.date ? `・${s.date}` : ''}）</span></li>)}</ul>
      </details>
      <p className="muted small">更新 {e.updated}</p>
    </article>
  );
}

/** 朝の画面：今朝届いた項目（ピックアップを先に） */
export function WikiMorningCard({ items }: { items: WikiIndexItem[] }) {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => Number(Boolean(b.pickup)) - Number(Boolean(a.pickup)));
  return (
    <section className="card wiki-morning">
      <div className="label">今朝のFP辞書</div>
      <ul className="cfp-list">{sorted.map((e) => <WikiRow key={e.id} e={e} />)}</ul>
    </section>
  );
}

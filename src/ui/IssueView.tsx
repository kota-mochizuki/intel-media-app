import { useEffect, useState } from 'react';
import type { Issue, Item, ItemFeedback } from '../types';
import { cachedIssue, fetchIssue } from '../lib/data';
import { formatDate, readMinutes, themeOf } from '../lib/dates';
import { setItem } from '../lib/feedback';
import { useFeedback, type Status } from './useFeedback';
import { Artwork, Figure } from './Figure';
import { Inline, RichText } from './RichText';
import { BriefCard, toggleBriefDone, useBrief } from './BriefCard';
import { ChecklistCards } from './ChecklistCard';

const CATEGORY: Record<string, string> = { A: '今すぐ', B: '専門性', C: '将来の選択肢', D: '好奇心', E: '認識の更新' };
const KIND: Record<string, string> = { deepdive: '深掘り', digest: 'まとめ' };

function useIssue(id: string | undefined) {
  const [issue, setIssue] = useState<Issue | null>(() => (id ? cachedIssue(id) : null));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let off = false;
    fetchIssue(id).then((i) => { if (!off) setIssue(i); }).catch((e: Error) => { if (!off) setError(e.message); });
    return () => { off = true; };
  }, [id]);
  return { issue, error };
}

/** 1日分の画面。isToday のときだけ、やることリスト（入籍の準備など）も出す */
export function IssueView({ id, ids, isToday }: { id: string; ids: string[]; isToday?: boolean }) {
  const { issue, error } = useIssue(id);
  const prevId = ids[ids.indexOf(id) + 1];
  const { issue: prev } = useIssue(prevId);
  const { fb, update, status } = useFeedback(id);
  const brief = useBrief(id); // 秘書の報告は同じ日のフィードバックに書くので、更新は1つの useFeedback にまとめる
  const theme = themeOf(id);

  if (!issue) return error ? <section className="card welcome"><p>{error}</p></section> : <Skeleton />;
  const onItem = (itemId: string, patch: ItemFeedback) => update((f) => setItem(f, itemId, patch));
  const quiz = prev?.bonus?.type === '1問クイズ' && prev.bonus.answer ? prev.bonus : null;

  return (
    <article className="issue" data-hue={theme.hue}>
      <header className="masthead">
        <div className="masthead-date">{formatDate(id)}</div>
        <div className="masthead-row">
          <span className="theme">{KIND[issue.kind] ?? theme.name}</span>
          <span className="muted">約{readMinutes(issue)}分</span>
          {fb.read && <span className="read-mark">読了</span>}
          <SaveBadge status={status} />
        </div>
      </header>

      {brief && <BriefCard compact brief={brief} fb={fb} onToggle={(i) => update((f) => toggleBriefDone(f, i))} />}
      {isToday && <ChecklistCards compact />}

      {quiz && (
        <section className="card quiz-answer">
          <div className="label">前回のクイズの答え</div>
          <p className="q"><Inline text={quiz.body} /></p>
          <p className="a"><Inline text={quiz.answer ?? ''} /></p>
        </section>
      )}

      {issue.note && <p className="note"><Inline text={issue.note} /></p>}

      {issue.items.map((it) => <ItemCard key={it.id} item={it} fb={fb.items[it.id] ?? {}} onChange={(p) => onItem(it.id, p)} />)}

      {issue.bonus && (
        <section className="card bonus">
          <div className="label">おまけ ・ {issue.bonus.type}</div>
          {issue.bonus.image && <Artwork img={issue.bonus.image} />}
          <p><Inline text={issue.bonus.body} /></p>
          {issue.bonus.answer && <p className="muted small">答えは次の配信で。</p>}
          {issue.bonus.source && <p className="small"><a href={issue.bonus.source.url} target="_blank" rel="noreferrer"><Inline text={issue.bonus.source.title} /></a><span className="nobr">（{issue.bonus.source.publisher}）</span></p>}
        </section>
      )}

      {issue.ask && (
        <section className="card ask">
          <div className="label">確認したいこと</div>
          <p><Inline text={issue.ask} /></p>
          <textarea rows={3} placeholder="一言で大丈夫です" value={fb.answer ?? ''} onChange={(e) => update((f) => ({ ...f, answer: e.target.value }))} />
        </section>
      )}

      <section className="finish">
        {!fb.read ? (
          <button className="btn btn-big" onClick={() => update((f) => ({ ...f, read: true }))}>読んだ</button>
        ) : (
          <div className="card done">
            <p className="done-title">おつかれさまでした</p>
            <label className="label" htmlFor="overall">全体への一言（任意）</label>
            <textarea id="overall" rows={3} placeholder="感想・違和感・やってみたこと、なんでも" value={fb.note ?? ''} onChange={(e) => update((f) => ({ ...f, note: e.target.value }))} />
            <button className="btn-text" onClick={() => update((f) => ({ ...f, read: false }))}>読了を取り消す</button>
          </div>
        )}
      </section>
      {isToday && <p className="past-link"><a href="#/past">過去の配信を見る</a></p>}
    </article>
  );
}

function ItemCard({ item, fb, onChange }: { item: Item; fb: ItemFeedback; onChange: (p: ItemFeedback) => void }) {
  const [noteOpen, setNoteOpen] = useState(Boolean(fb.note));
  return (
    <section className="card item">
      <div className="chips">
        <span className="chip">{CATEGORY[item.category] ?? item.category}</span>
        {item.outside && <span className="chip chip-outside">外側</span>}
      </div>
      <h2 className="title"><Inline text={item.title} /></h2>
      <div className="insight">
        <div className="insight-label">なるほど ・ {item.insight.type}</div>
        <p><Inline text={item.insight.text} /></p>
      </div>
      {item.points?.length ? (
        <>
          <h3 className="sec">要点</h3>
          <ul className="points">{item.points.map((p, i) => <li key={i}><Inline text={p} /></li>)}</ul>
        </>
      ) : item.summary && <RichText text={item.summary} />}
      {item.figure && <Figure fig={item.figure} />}
      <h3 className="sec">私にとって</h3>
      <RichText text={item.why} />
      {item.action && (
        <label className={`action ${fb.done ? 'is-done' : ''}`}>
          <input type="checkbox" checked={Boolean(fb.done)} onChange={(e) => onChange({ done: e.target.checked })} />
          <span><b>必要な行動</b>　<Inline text={item.action} /></span>
        </label>
      )}
      {item.detail && (
        <details className="fold fold-detail">
          <summary>くわしく</summary>
          <div className="detail"><RichText text={item.detail} /></div>
        </details>
      )}
      <details className="fold">
        <summary>出典（{item.sources.length}）</summary>
        <ul className="sources">
          {item.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer"><Inline text={s.title} /></a><span className="muted">（{s.publisher}、<span className="nobr">{s.published}</span>）</span></li>)}
        </ul>
        {item.recencyNote && <p className="small muted">古い出典を使う理由：{item.recencyNote}</p>}
      </details>
      <details className="fold">
        <summary>編集メモ（見直しの記録）</summary>
        <ol className="polish">{item.polish.map((p, i) => <li key={i}><b><Inline text={p.angle} /></b>：<Inline text={p.change} /></li>)}</ol>
      </details>
      <div className="react">
        <button className={`react-btn ${fb.star ? 'on' : ''}`} aria-pressed={Boolean(fb.star)} onClick={() => onChange({ star: !fb.star })}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z" fill={fb.star ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          {fb.star ? '残した' : '残す'}
        </button>
        <button className={`react-btn ${noteOpen ? 'on-soft' : ''}`} onClick={() => setNoteOpen((v) => !v)}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          一言
        </button>
      </div>
      {noteOpen && <textarea rows={2} autoFocus={!fb.note} placeholder="なるほど・違和感・疑問・やってみたこと" value={fb.note ?? ''} onChange={(e) => onChange({ note: e.target.value })} />}
    </section>
  );
}

function SaveBadge({ status }: { status: Status }) {
  if (status === 'idle') return null;
  const text = status === 'saving' ? '保存中…' : status === 'saved' ? '保存済み' : 'あとで送信';
  return <span className={`save save-${status}`}>{text}</span>;
}

function Skeleton() {
  return <div className="issue"><div className="sk sk-head" /><div className="sk sk-card" /><div className="sk sk-card" /></div>;
}

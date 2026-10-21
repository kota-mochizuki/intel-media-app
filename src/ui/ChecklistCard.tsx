import { useEffect, useState } from 'react';
import type { Checklist, ListItem } from '../types';
import { cachedList, cachedListIds, fetchList, fetchListIds } from '../lib/data';
import { daysUntil, nextItems, progress } from '../lib/checklist';
import { formatDate, todayJst } from '../lib/dates';
import { Inline } from './RichText';
import { useChecks } from './useChecks';

/** compact：朝の画面用。見出し1行と、次にやること2つだけ（残りは折りたたみ） */
export function ChecklistCards({ compact }: { compact?: boolean }) {
  const [ids, setIds] = useState<string[]>(cachedListIds);
  useEffect(() => {
    let off = false;
    fetchListIds().then((x) => { if (!off) setIds(x); }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, []);
  return <>{ids.map((id) => <ChecklistOf key={id} id={id} compact={compact} />)}</>;
}

function ChecklistOf({ id, compact }: { id: string; compact?: boolean }) {
  const [list, setList] = useState<Checklist | null>(() => cachedList(id));
  useEffect(() => {
    let off = false;
    fetchList(id).then((l) => { if (!off) setList(l); }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, [id]);
  const { done, toggle } = useChecks(id);
  // 押した項目は、画面を開き直すまで「次にやること」に取り消し線で残す（押し間違いをすぐ戻せるように）
  const [kept, setKept] = useState<Set<string>>(new Set());
  const onToggle = (itemId: string) => {
    if (!done[itemId]) setKept((k) => new Set(k).add(itemId));
    toggle(itemId);
  };
  if (!list) return null;

  const today = todayJst();
  const p = progress(list, done);
  const left = list.target ? daysUntil(list.target, today) : null;
  const doneForNext = Object.fromEntries(Object.entries(done).filter(([k]) => !kept.has(k)));
  const next = nextItems(list, doneForNext, compact ? 2 : 3);
  const firstOpen = list.sections.find((s) => s.items.some((i) => !done[i.id]))?.id;

  const all = (
    <details className="fold">
      <summary>すべての項目（{p.total}）</summary>
      {list.intro && <p className="small muted"><Inline text={list.intro} /></p>}
      {list.sections.map((s) => {
        const d = s.items.filter((i) => done[i.id]).length;
        return (
          <details key={s.id} className="cl-section" open={s.id === firstOpen}>
            <summary><span className="cl-count muted small">{d}/{s.items.length}</span><span className="cl-sname">{s.title}</span></summary>
            <ul className="cl-list">{s.items.map((i) => <Row key={i.id} item={i} done={Boolean(done[i.id])} today={today} onToggle={() => onToggle(i.id)} />)}</ul>
          </details>
        );
      })}
    </details>
  );
  if (compact) return (
    <section className="card checklist cl-compact">
      <div className="cl-head">
        <b>{list.title}</b>
        <span className="muted small">{p.done}/{p.total}{left !== null && left >= 0 && `・あと${left}日`}</span>
      </div>
      {next.length > 0 ? (
        <ul className="cl-mini">
          {next.map((i) => (
            <li key={i.id} className={done[i.id] ? 'is-done' : ''}>
              <label>
                <input type="checkbox" checked={Boolean(done[i.id])} onChange={() => onToggle(i.id)} />
                <span className="cl-text"><Inline text={i.text} /></span>
                {i.due && <span className="muted small nobr">〜{Number(i.due.slice(5, 7))}/{Number(i.due.slice(8, 10))}</span>}
              </label>
            </li>
          ))}
        </ul>
      ) : <p className="small muted">すべて終わりました。</p>}
      {all}
    </section>
  );
  return (
    <section className="card checklist">
      <div className="label">やることリスト</div>
      <h2 className="cl-title">{list.title}</h2>
      <div className="cl-meta">
        {left !== null && left >= 0 && <span className="cl-days">{formatDate(list.target!)}まで<b>あと{left}日</b></span>}
        <span className="muted">{p.done} / {p.total} 済み</span>
      </div>
      <div className="cl-bar" role="progressbar" aria-valuenow={p.done} aria-valuemin={0} aria-valuemax={p.total}><span style={{ width: `${(p.done / p.total) * 100}%` }} /></div>

      {next.length > 0 ? (
        <>
          <h3 className="sec">次にやること</h3>
          <ul className="cl-list">{next.map((i) => <Row key={i.id} item={i} done={Boolean(done[i.id])} today={today} onToggle={() => onToggle(i.id)} />)}</ul>
        </>
      ) : <p className="done-title">すべて終わりました。おつかれさまでした。</p>}

      {all}
    </section>
  );
}

function Row({ item, done, today, onToggle }: { item: ListItem; done: boolean; today: string; onToggle: () => void }) {
  const left = item.due ? daysUntil(item.due, today) : null;
  return (
    <li className={`cl-row ${done ? 'is-done' : ''}`}>
      <label>
        <input type="checkbox" checked={done} onChange={onToggle} />
        <span className="cl-text"><Inline text={item.text} /></span>
      </label>
      <div className="cl-chips">
        <span className="chip">{item.who}</span>
        {item.due && <span className={`chip ${!done && left !== null && left <= 3 ? 'chip-soon' : ''}`}>〜{Number(item.due.slice(5, 7))}/{Number(item.due.slice(8, 10))}</span>}
      </div>
      {item.note && (
        <details className="fold cl-note">
          <summary>くわしく</summary>
          <p className="small"><Inline text={item.note} /></p>
          {item.source && <p className="small"><a href={item.source.url} target="_blank" rel="noreferrer">{item.source.title}</a><span className="muted">（{item.source.publisher}）</span></p>}
        </details>
      )}
    </li>
  );
}

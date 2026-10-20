import { useEffect, useState } from 'react';
import type { Brief, BriefTask, Feedback } from '../types';
import { cachedBrief, fetchBrief } from '../lib/data';
import { Inline } from './RichText';

export function useBrief(id: string) {
  const [brief, setBrief] = useState<Brief | null>(() => cachedBrief(id));
  useEffect(() => {
    let off = false;
    fetchBrief(id).then((b) => { if (!off) setBrief(b); }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, [id]);
  return brief;
}

const dueLabel = (d?: string) => (d ? `（〜${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}）` : '');

function Tasks({ tasks }: { tasks: BriefTask[] }) {
  return <ul className="brief-list">{tasks.map((t, i) => <li key={i}><Inline text={t.text} /><span className="muted small">{dueLabel(t.due)}</span></li>)}</ul>;
}

/** 秘書の朝の報告。今日やることはチェックでき、翌朝の秘書が読む */
export function BriefCard({ brief, fb, onToggle }: { brief: Brief; fb: Feedback; onToggle: (i: number) => void }) {
  const done = new Set(fb.brief?.done ?? []);
  const h = brief.horizon;
  return (
    <section className="card brief">
      <div className="label">秘書から</div>
      {brief.greeting && <p className="brief-greet"><Inline text={brief.greeting} /></p>}
      {brief.signals?.length ? (
        <ul className="signals">{brief.signals.map((s, i) => <li key={i} className={s.level === '赤' ? 'sig-red' : 'sig-yellow'}><b>{s.area}</b>　<Inline text={s.text} /></li>)}</ul>
      ) : null}
      <h3 className="sec">今日やること</h3>
      <ul className="brief-today">
        {brief.today.map((t, i) => (
          <li key={i}>
            <label className={done.has(i) ? 'is-done' : ''}>
              <input type="checkbox" checked={done.has(i)} onChange={() => onToggle(i)} />
              <span><Inline text={t.text} />{t.why && <span className="brief-why"><Inline text={t.why} /></span>}</span>
            </label>
          </li>
        ))}
      </ul>
      {brief.week?.length ? <><h3 className="sec">今週</h3><Tasks tasks={brief.week} /></> : null}
      {brief.month?.length ? <><h3 className="sec">今月</h3><Tasks tasks={brief.month} /></> : null}
      <details className="fold horizon">
        <summary>この先の見通し（1年・5年・10年）</summary>
        {([['1年', h.year], ['5年後', h.five], ['10年後', h.ten]] as const).map(([k, v]) => (
          <div key={k} className="hz">
            <div className="hz-head"><span className="hz-k">{k}</span><span className="hz-line"><Inline text={v.line} /></span></div>
            {v.detail && <p className="hz-detail"><Inline text={v.detail} /></p>}
          </div>
        ))}
      </details>
    </section>
  );
}

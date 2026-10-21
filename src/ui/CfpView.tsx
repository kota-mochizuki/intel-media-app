import { useEffect, useState } from 'react';
import { daysUntil } from '../lib/checklist';
import { CFP_APP, EXAM_DAY, SUBJECT_SHORT, cachedCfp, fetchCfp, summarize, type CfpLecture, type CfpState } from '../lib/cfp';
import { todayJst } from '../lib/dates';

const fmt = (iso: string) => { const d = new Date(new Date(iso).getTime() + 9 * 3600_000); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };

/** 「CFP」タブ：CFPアプリの講義のうち、まだ解いていないものと進み具合。開くとCFPアプリの講義へ飛ぶ */
export function CfpView() {
  const [s, setS] = useState<CfpState | null>(cachedCfp);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    fetchCfp().then((x) => { if (!off) { setS(x); setError(null); } }).catch((e: Error) => { if (!off) setError(e.message); });
    return () => { off = true; };
  }, []);
  if (!s) return error ? <section className="card welcome"><p>{error}</p></section> : <div className="sk sk-card" />;
  const { open, done, doneBy } = summarize(s);
  const subjects = Object.keys(SUBJECT_SHORT).filter((k) => s.totals[k]);
  return (
    <div className="cfpview">
      <header className="masthead masthead-brief">
        <div className="masthead-date">CFP 試験まで{daysUntil(EXAM_DAY, todayJst())}日</div>
        <div className="masthead-row">
          <span className="theme">解き終えた講義 {done.length} / {s.total}</span>
          {s.progressAt && <span className="muted small">記録 {fmt(s.progressAt)}</span>}
        </div>
      </header>
      {error && <p className="note">{error}（前回の控えを表示しています）</p>}
      <section className="card">
        <div className="label">まだ解いていない講義（{open.length}）</div>
        {open.length ? <ul className="cfp-list">{open.map((l) => <LectureRow key={l.id} l={l} n={s.answered[l.id] ?? 0} />)}</ul>
          : <p className="muted">すべて解き終えています。次の講義は夜のうちに届きます。</p>}
        <a className="btn" href={CFP_APP} target="_blank" rel="noreferrer">CFPアプリを開く</a>
      </section>
      <section className="card">
        <div className="label">課目ごとの進み</div>
        <ul className="cfp-bars">
          {subjects.map((k) => {
            const n = doneBy[k] ?? 0, t = s.totals[k];
            return <li key={k}><span className="cfp-sub">{SUBJECT_SHORT[k]}</span><span className="cfp-bar"><i style={{ width: `${Math.min(100, (n / t) * 100)}%` }} /></span><span className="muted small">{n}/{t}</span></li>;
          })}
        </ul>
        {done.length > 0 && (
          <details className="fold">
            <summary>最近解き終えた講義</summary>
            <ul className="cfp-list">{done.slice(0, 5).map((l) => <LectureRow key={l.id} l={l} n={s.answered[l.id] ?? 0} />)}</ul>
          </details>
        )}
      </section>
    </div>
  );
}

function LectureRow({ l, n }: { l: CfpLecture; n: number }) {
  return (
    <li>
      <a href={`${CFP_APP}#/lecture/${l.id}`} target="_blank" rel="noreferrer">
        <span className="cfp-title">{l.title}</span>
        <span className="muted small">{l.id}・{SUBJECT_SHORT[l.subject] ?? l.subject}・約{l.minutes}分・確認問題 {n}/{l.questions}</span>
      </a>
    </li>
  );
}

import { useEffect, useState } from 'react';
import { cachedCoach, fetchCoach } from '../lib/data';
import type { CoachNote } from '../types';
import { todayJst } from '../lib/dates';
import { byTopic, planFor, progress, rangeLabel, touchedDays } from '../lib/study';
import type { StudyItem } from '../types';
import { useStudy } from './useStudy';
import { Inline } from './RichText';

/** その日の先生の一言。控えをすぐ出し、裏で最新を読む */
function useCoach(day: string, on: boolean) {
  const [c, setC] = useState<CoachNote | null>(() => (on ? cachedCoach(day) : null));
  useEffect(() => {
    if (!on) return;
    let off = false;
    fetchCoach(day).then((x) => { if (!off) setC(x); }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, [day, on]);
  return c;
}

const stars = (s: number[]) => '★'.repeat(Math.max(...s, 0));

/** 今日の過去問（朝・夜の画面）。まず「最低ライン」の大問1つだけを見せる。
 *  1つ記録したら最低ライン達成。調子がよければ、今日の範囲の残りを開いて続ける（量より続けた日を大事にする） */
/** onlyIfOpen：夜の画面用。今日まだ1つも記録していない日だけ出す */
export function StudyCard({ day = todayJst(), onlyIfOpen }: { day?: string; onlyIfOpen?: boolean }) {
  const { data, st, setScore } = useStudy();
  const [more, setMore] = useState(false);
  const coach = useCoach(day, !onlyIfOpen);
  if (!data) return null;
  const { book, until, set, bookRows, reviewRows, first, done } = planFor(data.index, data.books, st, day);
  if (!book && !reviewRows.length) return null;
  if (onlyIfOpen && done) return null;
  const week = touchedDays(st, day);
  const row = (k: string, it: StudyItem, label: string) => {
    const sc = st.scores?.[k];
    return (
      <li key={k}>
        <div className="study-q"><b>{label}</b> {it.topic}<span className="muted small"> {it.level} {stars(it.stars)}</span></div>
        <div className="study-btns" role="group" aria-label={`${label}の正解数`}>
          {Array.from({ length: it.stars.length + 1 }, (_, c) => (
            <button key={c} className={sc?.c === c ? 'on' : ''} onClick={() => setScore(k, { c, n: it.stars.length, d: day })}>{c}</button>
          ))}
          <span className="muted small">/{it.stars.length}</span>
        </div>
      </li>
    );
  };
  const open = done || more;
  const restN = [...bookRows, ...reviewRows].filter((r) => r !== first).reduce((s, r) => s + r.it.stars.length, 0);
  return (
    <section className="card study">
      <div className="cl-head"><b>{onlyIfOpen ? 'まだの過去問' : '今日の過去問'}{book ? `：${book.name}` : ''}</b><span className="muted small">今週 {week}/7日</span></div>
      {coach && (
        <div className="coach">
          <div className="label">先生から</div>
          <p><Inline text={coach.look} /></p>
          <p><b>今日は</b> <Inline text={coach.today} /></p>
          {coach.plan && <p className="muted small">計画の見直し：<Inline text={coach.plan} /></p>}
        </div>
      )}
      {done ? (
        <p className="gentle">今日の最低ラインは達成です。ここから先は、余力のぶんだけで十分です。</p>
      ) : first && (
        <>
          <p className="study-min">今日の最低ライン：<b>{first.label}</b> の1つだけ<span className="muted small">（{first.it.stars.length}設問・約{first.it.stars.length * 3}分）</span></p>
          <ul className="study-list">{row(first.k, first.it, first.label)}</ul>
        </>
      )}
      {!open && restN > 0 && <button className="btn-text" onClick={() => setMore(true)}>調子がいいので、続きもやる（今日の範囲はあと{restN}設問）</button>}
      {open && (
        <>
          {book && set.length > 0 && <p className="muted small">{done ? '' : 'ここからは余力で。'}今日の範囲 {rangeLabel(set)}{until ? `・${Number(until.slice(5, 7))}/${Number(until.slice(8, 10))}までに1周のペース` : ''}</p>}
          <p className="muted small">解いたら、大問ごとに<b>正解した設問の数</b>を押す（選んだ番号ではありません）</p>
          {bookRows.length > 0 && <ul className="study-list">{bookRows.filter((r) => done || r !== first).map((r) => row(r.k, r.it, r.label))}</ul>}
          {reviewRows.filter((r) => done || r !== first).length > 0 && (
            <>
              <h3 className="sec">復習（前に間違えた大問）</h3>
              <ul className="study-list">{reviewRows.filter((r) => done || r !== first).map((r) => row(r.k, r.it, r.label))}</ul>
            </>
          )}
        </>
      )}
      <p className="small"><a href="#/study">進み具合と分野別の正答率</a></p>
    </section>
  );
}

/** 過去問の進み具合（朝の画面のリンクから開く） */
export function StudyView() {
  const { data, st, addMock } = useStudy();
  if (!data) return <div className="sk sk-card" />;
  return (
    <div className="studyview">
      <p className="small"><a href="#/">← 朝</a></p>
      <h1 className="page-title">過去問の進み具合</h1>
      {data.books.map((b) => {
        const p = progress(b, st), topics = byTopic(b, st), mocks = st.mocks?.[b.id] ?? [], seed = st.seeds?.[b.id];
        return (
          <section key={b.id} className="card">
            <div className="cl-head"><b>{b.name}</b><span className="muted small">{p.done}/{p.total}設問</span></div>
            <div className="cl-bar"><span style={{ width: `${(p.done / p.total) * 100}%` }} /></div>
            <p className="small">正答率 {p.done ? Math.round((p.c / p.done) * 100) : 0}%（{p.c}/{p.done}）{mocks.map((m, i) => <span key={i} className="muted">　模試 {m.c}/{m.n}（{m.d}）</span>)}</p>
            <MockInput total={b.mock.total} onSave={(c) => addMock(b.id, { c, n: b.mock.total, d: todayJst() })} />
            {seed && <p className="muted small">問1〜問{seed.upTo}は申告分（{seed.c}/{seed.n}）。分野別には入りません</p>}
            {topics.length > 0 && (
              <>
                <h3 className="sec">分野別（低い順）</h3>
                <ul className="study-topics">{topics.map((t) => (
                  <li key={t.topic} className={t.review ? 'review' : ''}><span>{t.topic}</span><span className="small">{Math.round(t.rate * 100)}%（{t.c}/{t.n}）{t.review ? '・復習' : ''}</span></li>
                ))}</ul>
              </>
            )}
          </section>
        );
      })}
      <p className="muted small">ほかの科目は、目次の写真を送ると追加します。</p>
    </div>
  );
}

/** 模試の点数を記録する（1周のあとに解き直したとき） */
function MockInput({ total, onSave }: { total: number; onSave: (c: number) => void }) {
  const [v, setV] = useState('');
  const c = Number(v);
  const ok = v !== '' && Number.isInteger(c) && c >= 0 && c <= total;
  return (
    <div className="mock-input small">
      <span>模試の点数を記録</span>
      <input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ''))} aria-label="模試の点数" />
      <span className="muted">/{total}</span>
      <button className="btn-text" disabled={!ok} onClick={() => { onSave(c); setV(''); }}>記録</button>
    </div>
  );
}

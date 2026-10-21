import { useState } from 'react';
import { todayJst } from '../lib/dates';
import { byTopic, currentBook, dailyTarget, progress, rangeLabel, reviewKey, reviewSet, scoreKey, todaySet } from '../lib/study';
import type { StudyItem } from '../types';
import { useStudy } from './useStudy';

const stars = (s: number[]) => '★'.repeat(Math.max(...s, 0));

/** 今日の過去問（朝・夜の画面）。解いたら大問ごとに正答数を押すだけ */
export function StudyCard({ day = todayJst() }: { day?: string }) {
  const { data, st, setScore } = useStudy();
  if (!data) return null;
  const book = currentBook(data.books, data.index.order, st);
  const reviews = reviewSet(data.books, st, day, data.index.reviewFrom, data.index.reviewPerDay ?? 2);
  if (!book && !reviews.length) return null;
  const until = book ? data.index.until?.[book.id] : undefined;
  const set = book ? todaySet(book, st, day, dailyTarget(book, st, day, until, data.index.dailyTarget)) : [];
  const n = set.reduce((s, it) => s + it.stars.length, 0) + reviews.reduce((s, r) => s + r.item.stars.length, 0);
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
  return (
    <section className="card study">
      <div className="cl-head"><b>今日の過去問{book ? `：${book.name}` : ''}</b><span className="muted small">{n}設問・目安{Math.round(n * 3)}分</span></div>
      {book && <p className="muted small">{rangeLabel(set)}{until ? `・${Number(until.slice(5, 7))}/${Number(until.slice(8, 10))}までに1周` : ''}</p>}
      <p className="muted small">解いたら、大問ごとに<b>正解した設問の数</b>を押す（選んだ番号ではありません）</p>
      {book && <ul className="study-list">{set.map((it) => row(scoreKey(book.id, it.no), it, `問${it.no}`))}</ul>}
      {reviews.length > 0 && (
        <>
          <h3 className="sec">復習（前に間違えた大問）</h3>
          <ul className="study-list">{reviews.map((r) => row(reviewKey(r.book.id, r.item.no, r.round), r.item, `${r.book.name} 問${r.item.no}（${r.round}回目）`))}</ul>
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

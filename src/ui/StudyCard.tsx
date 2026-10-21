import { todayJst } from '../lib/dates';
import { byTopic, currentBook, dailyTarget, progress, rangeLabel, scoreKey, todaySet } from '../lib/study';
import { useStudy } from './useStudy';

const stars = (s: number[]) => '★'.repeat(Math.max(...s, 0));

/** 今日の過去問（朝・夜の画面）。解いたら大問ごとに正答数を押すだけ */
export function StudyCard({ day = todayJst() }: { day?: string }) {
  const { data, st, setScore } = useStudy();
  if (!data) return null;
  const book = currentBook(data.books, data.index.order, st);
  if (!book) return null;
  const until = data.index.until?.[book.id];
  const set = todaySet(book, st, day, dailyTarget(book, st, day, until, data.index.dailyTarget));
  const n = set.reduce((s, it) => s + it.stars.length, 0);
  const rec = set.filter((it) => st.scores?.[scoreKey(book.id, it.no)]);
  return (
    <section className="card study">
      <div className="cl-head"><b>今日の過去問：{book.name}</b><span className="muted small">{rec.length}/{set.length}</span></div>
      <p className="muted small">{rangeLabel(set)}・{n}設問・目安{Math.round(n * 3)}分{until ? `・${Number(until.slice(5, 7))}/${Number(until.slice(8, 10))}までに1周` : ''}</p>
      <p className="muted small">解いたら、大問ごとに<b>正解した設問の数</b>を押す（選んだ番号ではありません）</p>
      <ul className="study-list">
        {set.map((it) => {
          const k = scoreKey(book.id, it.no), sc = st.scores?.[k];
          return (
            <li key={it.no}>
              <div className="study-q"><b>問{it.no}</b> {it.topic}<span className="muted small"> {it.level} {stars(it.stars)}</span></div>
              <div className="study-btns" role="group" aria-label={`問${it.no}の正答数`}>
                {Array.from({ length: it.stars.length + 1 }, (_, c) => (
                  <button key={c} className={sc?.c === c ? 'on' : ''} onClick={() => setScore(k, { c, n: it.stars.length, d: day })}>{c}</button>
                ))}
                <span className="muted small">/{it.stars.length}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="small"><a href="#/study">進み具合と分野別の正答率</a></p>
    </section>
  );
}

/** 過去問の進み具合（朝の画面のリンクから開く） */
export function StudyView() {
  const { data, st } = useStudy();
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

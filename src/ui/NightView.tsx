import { localFeedback } from '../lib/data';
import { formatDate, reflectionDay, weekday } from '../lib/dates';
import { lastDays, questionsFor, tally } from '../lib/night';
import { setBrief, useBrief } from './BriefCard';
import { Inline } from './RichText';
import { useFeedback } from './useFeedback';
import { StudyCard } from './StudyCard';

const WD = ['日', '月', '火', '水', '木', '金', '土'];

/** 「夜」タブ：1日の振り返り。進みたい方向に進めたかを、主観の2択で答える。答えは翌朝の秘書が読む */
export function NightView() {
  const id = reflectionDay();
  const brief = useBrief(id);
  const { fb, update } = useFeedback(id);
  const q = fb.brief?.q ?? {};
  const qs = questionsFor(id);
  const answer = (k: string, v: boolean) => update((f) => {
    const cur = { ...f.brief?.q };
    if (cur[k] === v) delete cur[k]; else cur[k] = v; // 同じ方をもう一度押すと取り消し
    return setBrief(f, { q: cur });
  });
  // 直近7日（今日を含む）。今日の分は入力中の値を使う
  const days = lastDays(id, 7);
  const qsOf = (d: string) => (d === id ? q : localFeedback(d)?.brief?.q);
  const t = tally(days.map(qsOf), qs);
  return (
    <div className="nightview">
      <header className="masthead masthead-night">
        <div className="masthead-date">{formatDate(id)}</div>
        <div className="masthead-row"><span className="theme">1日の振り返り</span><span className="muted">1分</span></div>
      </header>
      {brief?.evening && <p className="night-note"><Inline text={brief.evening} /></p>}
      <StudyCard day={id} />
      <section className="card night">
        <p className="muted small">直感で答えてください。正解はありません。</p>
        <ul className="nq">
          {qs.map((x, i) => (
            <li key={x.id}>
              {(i === 0 || qs[i - 1].group !== x.group) && <div className="nq-group">{x.group}</div>}
              <div className="nq-text">{x.text}</div>
              <div className="seg" role="group" aria-label={x.text}>
                <button className={q[x.id] === true ? 'on' : ''} onClick={() => answer(x.id, true)}>できた</button>
                <button className={q[x.id] === false ? 'on off' : ''} onClick={() => answer(x.id, false)}>できなかった</button>
              </div>
            </li>
          ))}
        </ul>
        <label className="carry"><span className="sec">ひとこと（任意）</span>
          <textarea rows={2} placeholder="よかったこと、明日に持ち越すことなど" value={fb.brief?.memo ?? ''} onChange={(e) => update((f) => setBrief(f, { memo: e.target.value }))} /></label>
      </section>
      <section className="card">
        <div className="label">この7日間</div>
        <table className="week">
          <thead><tr><th />{[...days].reverse().map((d) => <th key={d} className={d === id ? 'is-today' : ''}>{WD[weekday(d)]}</th>)}<th /></tr></thead>
          <tbody>
            {qs.map((x) => (
              <tr key={x.id}>
                <th>{x.short}</th>
                {[...days].reverse().map((d) => { const v = qsOf(d)?.[x.id]; return <td key={d}>{v === undefined ? <span className="dot-none">・</span> : v ? <span className="dot-yes">●</span> : <span className="dot-no">○</span>}</td>; })}
                <td className="muted small">{t[x.id].yes}/{t[x.id].answered}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">●できた ○できなかった。書いた内容は、明日の朝の秘書が読みます。おやすみなさい。</p>
      </section>
    </div>
  );
}

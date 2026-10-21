import { formatDate, reflectionDay } from '../lib/dates';
import { setBrief, toggleBriefDone, useBrief } from './BriefCard';
import { Inline } from './RichText';
import { useFeedback } from './useFeedback';

/** 「夜」タブ：寝る前の振り返り。答えは同じ日のフィードバックに保存し、翌朝の秘書が読む */
export function NightView() {
  const id = reflectionDay();
  const brief = useBrief(id);
  const { fb, update } = useFeedback(id);
  const b = fb.brief ?? { done: [] };
  const done = new Set(b.done);
  return (
    <div className="nightview">
      <header className="masthead masthead-night">
        <div className="masthead-date">{formatDate(id)}</div>
        <div className="masthead-row"><span className="theme">今日の振り返り</span><span className="muted">1〜2分</span></div>
      </header>
      {brief?.evening && <section className="card night-note"><div className="label">秘書から</div><p><Inline text={brief.evening} /></p></section>}
      <section className="card night">
        {brief && (
          <>
            <h3 className="sec">今朝の「やること」</h3>
            <ul className="brief-today">
              {brief.today.map((t, i) => (
                <li key={i}><label className={done.has(i) ? 'is-done' : ''}><input type="checkbox" checked={done.has(i)} onChange={() => update((f) => toggleBriefDone(f, i))} /><span><Inline text={t.text} /></span></label></li>
              ))}
            </ul>
          </>
        )}
        <h3 className="sec">余白の時間（サウナ・読書・ゲームなど）</h3>
        <div className="seg" role="group" aria-label="余白の時間">
          {([[true, 'とれた'], [false, 'とれなかった']] as const).map(([v, label]) => (
            <button key={label} className={b.yohaku === v ? 'on' : ''} onClick={() => update((f) => setBrief(f, { yohaku: b.yohaku === v ? undefined : v }))}>{label}</button>
          ))}
        </div>
        <label className="carry"><span className="sec">今日よかったこと（1つ）</span>
          <textarea rows={2} value={b.good ?? ''} onChange={(e) => update((f) => setBrief(f, { good: e.target.value }))} /></label>
        <label className="carry"><span className="sec">明日に持ち越すこと（なければ空で）</span>
          <textarea rows={2} value={b.carry ?? ''} onChange={(e) => update((f) => setBrief(f, { carry: e.target.value }))} /></label>
        <p className="muted small">書いた内容は、明日の朝の秘書が読みます。おやすみなさい。</p>
      </section>
      {!brief && <p className="muted small">今日の秘書の報告はまだありません。</p>}
    </div>
  );
}

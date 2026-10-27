import { formatDate } from '../lib/dates';
import { asYesterday, questionOfDay } from '../lib/night';
import { setBrief } from './BriefCard';
import { useFeedback } from './useFeedback';

const MOODS = [{ v: 1, t: '低め' }, { v: 2, t: 'ふつう' }, { v: 3, t: 'よかった' }] as const;

/** 秘書タブ：昨日の振り返り（夜タブの代わりに、翌朝ここで書く）。調子・できたこと1つ・日替わりの1問。
 *  書いた内容は、その日の feedback に入り、先生と秘書が読む */
export function YesterdayCard({ day }: { day: string }) {
  const { fb, update } = useFeedback(day);
  const b = fb.brief;
  const q = questionOfDay(day);
  const ans = b?.q?.[q.id];
  const setQ = (v: boolean) => update((f) => {
    const cur = { ...f.brief?.q };
    if (cur[q.id] === v) delete cur[q.id]; else cur[q.id] = v;
    return setBrief(f, { q: cur });
  });
  return (
    <section className="card yesterday">
      <div className="label">昨日の振り返り（{formatDate(day)}）</div>
      <div className="seg seg3" role="group" aria-label="昨日の調子">
        {MOODS.map((m) => (
          <button key={m.v} className={b?.mood === m.v ? 'on' : ''} onClick={() => update((f) => setBrief(f, { mood: b?.mood === m.v ? undefined : m.v }))}>{m.t}</button>
        ))}
      </div>
      <input className="yd-win" placeholder="できたこと1つ（任意・小さなことで十分）" value={b?.win ?? ''} onChange={(e) => update((f) => setBrief(f, { win: e.target.value }))} />
      <div className="yd-q">
        <span>{asYesterday(q.text)}<span className="nq-from">{q.from}</span></span>
        <div className="seg" role="group" aria-label={q.text}>
          <button className={ans === true ? 'on' : ''} onClick={() => setQ(true)}>はい</button>
          <button className={ans === false ? 'on off' : ''} onClick={() => setQ(false)}>いいえ</button>
        </div>
      </div>
      {b?.mood && <p className="muted small">ありがとうございます。先生と秘書が、次の朝に読みます。</p>}
    </section>
  );
}

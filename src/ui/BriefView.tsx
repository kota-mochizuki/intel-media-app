import { useEffect, useState } from 'react';
import { cachedBriefIds, fetchBriefIds } from '../lib/data';
import { formatDate, todayJst } from '../lib/dates';
import { BriefCard, setBriefCarry, toggleBriefDone, useBrief } from './BriefCard';
import { useFeedback } from './useFeedback';
import { ChecklistCards } from './ChecklistCard';

/** 「秘書」タブ：いちばん新しい秘書の朝の報告と、過去の報告への切り替え */
export function BriefView() {
  const [ids, setIds] = useState<string[]>(cachedBriefIds);
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    fetchBriefIds().then((x) => { if (!off) setIds(x); }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, []);
  const latest = ids.find((id) => id <= todayJst()) ?? ids[0];
  const id = picked ?? latest;
  if (!id) {
    return (
      <div className="briefview">
        <section className="card welcome">
          <h1>まだ秘書の報告はありません</h1>
          <p>毎朝5時45分ごろに、今日・今週・今月にやることと、この先の見通しが届きます。</p>
        </section>
        <ChecklistCards />
      </div>
    );
  }
  return (
    <div className="briefview">
      <header className="masthead masthead-brief">
        <div className="masthead-date">{formatDate(id)}</div>
        <div className="masthead-row">
          <span className="theme">秘書からの報告</span>
          {id !== latest && <button className="btn-text" onClick={() => setPicked(null)}>最新の報告にもどる</button>}
        </div>
      </header>
      <BriefOf key={id} id={id} />
      <ChecklistCards />
      {ids.length > 1 && (
        <details className="fold past-briefs">
          <summary>過去の報告（{ids.length - 1}）</summary>
          <ul className="brief-list">
            {ids.filter((x) => x !== id).slice(0, 30).map((x) => (
              <li key={x}><button className="linklike" onClick={() => { setPicked(x); window.scrollTo(0, 0); }}>{formatDate(x)}</button></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function BriefOf({ id }: { id: string }) {
  const brief = useBrief(id);
  const { fb, update } = useFeedback(id);
  if (!brief) return <div className="sk sk-card" />;
  return (
    <BriefCard brief={brief} fb={fb} onToggle={(i) => update((f) => toggleBriefDone(f, i))} onCarry={(s) => update((f) => setBriefCarry(f, s))} />
  );
}

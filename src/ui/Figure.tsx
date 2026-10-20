import type { BonusImage, Figure as F } from '../types';

const fmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString('ja-JP') : v.toLocaleString('ja-JP', { maximumFractionDigits: 2 }));

/** 記事の図。種類ごとに、決まった形で描く */
export function Figure({ fig }: { fig: F }) {
  return (
    <figure className={`fig fig-${fig.type}`}>
      <figcaption className="fig-title">{fig.title}</figcaption>
      {fig.type === 'bars' && <Bars fig={fig} />}
      {fig.type === 'flow' && (
        <ol className="flow">
          {fig.steps.map((s, i) => (
            <li key={i} className="flow-step">
              <span className="flow-label">{s.label}</span>
              {s.detail && <span className="flow-detail">{s.detail}</span>}
            </li>
          ))}
        </ol>
      )}
      {fig.type === 'compare' && (
        <div className="compare" style={{ gridTemplateColumns: `repeat(${fig.columns.length}, minmax(0, 1fr))` }}>
          {fig.columns.map((c, i) => (
            <div key={i} className="compare-col">
              <div className="compare-head">{c.heading}</div>
              <ul>{c.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {fig.type === 'timeline' && (
        <ol className="timeline">
          {fig.events.map((e, i) => <li key={i}><span className="tl-date">{e.date}</span><span className="tl-label">{e.label}</span></li>)}
        </ol>
      )}
      {fig.note && <p className="fig-note">{fig.note}</p>}
      <p className="fig-source">出典：<a href={fig.source.url} target="_blank" rel="noreferrer">{fig.source.publisher}</a>（{fig.source.published}）</p>
    </figure>
  );
}

function Bars({ fig }: { fig: Extract<F, { type: 'bars' }> }) {
  const max = Math.max(...fig.bars.map((b) => b.value), 0) || 1;
  return (
    <div className="bars" role="list">
      {fig.bars.map((b, i) => (
        <div key={i} className="bar" role="listitem" aria-label={`${b.label} ${fmt(b.value)}${fig.unit ?? ''}`}>
          <span className="bar-label">{b.label}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: `${Math.max(2, (b.value / max) * 100)}%` }} /></span>
          <span className="bar-value">{fmt(b.value)}<small>{fig.unit}</small></span>
        </div>
      ))}
    </div>
  );
}

/** 今日の一枚の画像（自由利用が明示された作品だけ） */
export function Artwork({ img }: { img: BonusImage }) {
  return (
    <figure className="art">
      <a href={img.page} target="_blank" rel="noreferrer"><img src={img.url} alt={img.alt} loading="lazy" decoding="async" /></a>
      <figcaption className="small muted">{img.credit}（{img.license}）</figcaption>
    </figure>
  );
}

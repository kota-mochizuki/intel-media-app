import { Fragment, type ReactNode } from 'react';
import { phrases } from '../lib/phrases';

const NOWRAP_MAX = 20; // これより長い文節だけは、画面幅に収まらないことがあるので中で折り返しを許す
const NUM = /(\d[\d.,:\-／/]*\d|\d+)/g; // 8.8、1,016、2027-10 などの数字

/** 長い文節の中でも、数字の途中では改行しない */
function KeepNumbers({ text }: { text: string }) {
  return <>{text.split(NUM).map((s, i) => (i % 2 ? <span key={i} className="nobr">{s}</span> : <Fragment key={i}>{s}</Fragment>))}</>;
}

/** 文節ごとに「中で改行しない」箱に入れる。改行は文節と文節の間だけで起こる（どのブラウザでも同じ） */
function Phrased({ text }: { text: string }) {
  return (
    <>
      {phrases(text).map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {p.length <= NOWRAP_MAX ? <span className="ph">{p}</span> : <KeepNumbers text={p} />}
        </Fragment>
      ))}
    </>
  );
}

/** **太字** だけを解釈する（HTMLは解釈しない） */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {/^\*\*[^*]+\*\*$/.test(p) ? <strong><Phrased text={p.slice(2, -2)} /></strong> : <Phrased text={p} />}
        </Fragment>
      ))}
    </>
  );
}

/** 改行で段落、「- 」「・」で始まる行のまとまりを箇条書きにする */
export function RichText({ text, className = 'body' }: { text: string; className?: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) out.push(<ul key={`u${out.length}`} className="rt-list">{bullets.map((b, i) => <li key={i}><Inline text={b} /></li>)}</ul>);
    bullets = [];
  };
  for (const l of lines) {
    const m = l.match(/^[-・]\s*(.*)$/);
    if (m) bullets.push(m[1]);
    else { flush(); out.push(<p key={`p${out.length}`} className={className}><Inline text={l} /></p>); }
  }
  flush();
  return <>{out}</>;
}

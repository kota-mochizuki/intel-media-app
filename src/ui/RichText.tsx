import { Fragment, type ReactNode } from 'react';
import { phrases } from '../lib/phrases';

/** 文節ごとに区切り、切れ目にだけ改行の候補（wbr）を置く */
function Phrased({ text }: { text: string }) {
  return <>{phrases(text).map((p, i) => <Fragment key={i}>{i > 0 && <wbr />}{p}</Fragment>)}</>;
}

/** **太字** だけを解釈する（HTMLは解釈しない）。太字の語句は1行に収める */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (!/^\*\*[^*]+\*\*$/.test(p)) return <Fragment key={i}>{i > 0 && <wbr />}<Phrased text={p} /></Fragment>;
        const inner = p.slice(2, -2);
        return <Fragment key={i}>{i > 0 && <wbr />}<strong className={inner.length <= 16 ? 'nobr' : undefined}><Phrased text={inner} /></strong></Fragment>;
      })}
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

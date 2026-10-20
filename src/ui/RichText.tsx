import { Fragment, type ReactNode } from 'react';

/** **太字** だけを解釈する（HTMLは解釈しない） */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => (/^\*\*[^*]+\*\*$/.test(p) ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>))}</>;
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

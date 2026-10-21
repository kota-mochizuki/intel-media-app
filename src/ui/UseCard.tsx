import { useState } from 'react';
import type { Brief } from '../types';
import { Inline } from './RichText';

/** 「役に立つ」：今日使える1つと、週1回の紹介元に送れる話題（文面はコピーして送る。記録はしない） */
export function UseCard({ brief }: { brief: Brief }) {
  const [copied, setCopied] = useState(false);
  const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* コピーできない環境 */ } };
  return (
    <>
      {brief.use && (
        <section className="card use">
          <div className="label">今日使える1つ{brief.use.to ? `（${brief.use.to}に）` : ''}</div>
          <h3>{brief.use.title}</h3>
          <p><Inline text={brief.use.text} /></p>
        </section>
      )}
      {brief.referral && (
        <section className="card use">
          <div className="label">紹介元に送れる話題（今週）</div>
          <h3>{brief.referral.title}</h3>
          <p><Inline text={brief.referral.text} /></p>
          <div className="use-msg">{brief.referral.message}</div>
          <button className="btn-text" onClick={() => copy(brief.referral!.message)}>{copied ? 'コピーしました' : '文面をコピー'}</button>
        </section>
      )}
    </>
  );
}

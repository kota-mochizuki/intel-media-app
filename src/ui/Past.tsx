import { useEffect, useState } from 'react';
import type { Issue } from '../types';
import { cachedIssue, feedbackMap, fetchIssue } from '../lib/data';
import { formatDate, monthLabel, themeOf, todayJst } from '../lib/dates';
import { starCount, unreadIds } from '../lib/feedback';

export function Past({ ids }: { ids: string[] }) {
  const [issues, setIssues] = useState<Record<string, Issue | null>>(() => Object.fromEntries(ids.map((id) => [id, cachedIssue(id)])));
  useEffect(() => {
    let off = false;
    // 見出しを出すため、手元にない配信だけ読み込む（新しい順に30本まで）
    for (const id of ids.slice(0, 30)) if (!cachedIssue(id)) fetchIssue(id).then((i) => { if (!off) setIssues((m) => ({ ...m, [id]: i })); }).catch(() => {});
    return () => { off = true; };
  }, [ids]);
  const fbs = feedbackMap(ids);
  const unread = unreadIds(ids, fbs, todayJst());

  if (!ids.length) return <section className="card welcome"><p>まだ配信がありません。</p></section>;
  const months = [...new Set(ids.map((id) => id.slice(0, 7)))];
  return (
    <div className="past">
      <h1 className="page-title">過去の配信</h1>
      {unread.length > 0 && <p className="gentle">まだ読んでいない配信が{unread.length}日分あります。全部読まなくて大丈夫です。</p>}
      {months.map((m) => (
        <section key={m}>
          <h2 className="month">{monthLabel(m + '-01')}</h2>
          <ul className="list">
            {ids.filter((id) => id.startsWith(m)).map((id) => {
              const t = themeOf(id), is = issues[id], fb = fbs[id], stars = starCount(fb);
              return (
                <li key={id} data-hue={t.hue}>
                  <a href={`#/issue/${id}`} className="row">
                    <span className="row-date">{formatDate(id)}</span>
                    <span className="row-main">
                      <span className="row-theme">{t.name}</span>
                      <span className="row-title">{is ? is.items.map((x) => x.title).join(' ／ ') || is.note || '（記事なし）' : '…'}</span>
                    </span>
                    <span className="row-meta">
                      {stars > 0 && <span className="row-star" aria-label={`☆${stars}`}>★{stars > 1 ? stars : ''}</span>}
                      {unread.includes(id) && <span className="dot" aria-label="未読" />}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

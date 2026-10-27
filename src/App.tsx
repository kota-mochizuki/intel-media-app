import { useEffect, useState } from 'react';
import { cachedIds, fetchIds, flushAll, isConfigured } from './lib/data';
import { todayJst } from './lib/dates';
import { IssueView } from './ui/IssueView';
import { Past } from './ui/Past';
import { Settings } from './ui/Settings';
import { WikiEntryView } from './ui/WikiView';
import { SecretaryView } from './ui/SecretaryView';
import { CoachView } from './ui/CoachView';
import { StudyView } from './ui/StudyCard';
import { ListsView } from './ui/ChecklistCard';

type Route = { tab: 'today' } | { tab: 'study' } | { tab: 'lists' } | { tab: 'coach' } | { tab: 'editor' } | { tab: 'wikiEntry'; id: string } | { tab: 'past' } | { tab: 'issue'; id: string } | { tab: 'settings' };
const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, '');
  const m = h.match(/^issue\/(\d{4}-\d{2}-\d{2})$/);
  if (m) return { tab: 'issue', id: m[1] };
  const w = h.match(/^wiki\/([\w.]+)$/);
  if (w) return { tab: 'wikiEntry', id: w[1] };
  // 夜タブは 2026-10-27 に廃止（振り返りは翌朝に秘書タブで）。古いリンク #/night は秘書へ、#/wiki は先生へ
  return h === 'study' ? { tab: 'study' } : h === 'lists' ? { tab: 'lists' } : h === 'coach' || h === 'wiki' ? { tab: 'coach' } : h === 'editor' ? { tab: 'editor' } : h === 'past' ? { tab: 'past' } : h === 'settings' ? { tab: 'settings' } : { tab: 'today' };
};

export function App() {
  const [route, setRoute] = useState<Route>(parse);
  const [ids, setIds] = useState<string[]>(cachedIds);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(isConfigured);

  useEffect(() => {
    const onHash = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    const onOnline = () => void flushAll();
    window.addEventListener('online', onOnline);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('online', onOnline); };
  }, []);

  useEffect(() => {
    if (!configured) return;
    let off = false;
    fetchIds()
      .then((x) => { if (!off) { setIds(x); setOffline(false); setError(null); } })
      .catch((e: Error) => { if (!off) { if (navigator.onLine) setError(e.message); else setOffline(true); } });
    void flushAll();
    return () => { off = true; };
  }, [configured]);

  // 「今日」は、今日以前でいちばん新しい配信
  const today = todayJst();
  const latest = ids.find((id) => id <= today) ?? ids[0];
  // タブ：秘書（やること）・先生（CFPと辞書）・編集長（読み物）
  const tab = route.tab === 'lists' ? 'today' : route.tab === 'study' || route.tab === 'wikiEntry' ? 'coach' : route.tab === 'issue' || route.tab === 'past' ? 'editor' : route.tab;

  let body;
  if (route.tab === 'settings') body = <Settings onSaved={() => { setConfigured(isConfigured()); }} />;
  else if (!configured) body = <Welcome />;
  else if (route.tab === 'study') body = <StudyView />;
  else if (route.tab === 'lists') body = <ListsView />;
  else if (route.tab === 'coach') body = <CoachView />;
  else if (route.tab === 'wikiEntry') body = <WikiEntryView key={route.id} id={route.id} />;
  else if (route.tab === 'past') body = <Past ids={ids} />;
  else if (route.tab === 'issue') body = <IssueView key={route.id} id={route.id} ids={ids} />;
  else if (route.tab === 'editor') body = latest ? <IssueView key={latest} id={latest} ids={ids} isToday /> : <Empty />;
  else body = <SecretaryView />;

  return (
    <>
      {offline && <div className="banner">オフラインです。保存済みの配信を表示しています。</div>}
      {error && <div className="banner banner-warn">{error}　<a href="#/settings">設定を確認</a></div>}
      <main className="main">{body}</main>
      <nav className="tabbar" aria-label="メニュー">
        <a href="#/" className={tab === 'today' ? 'on' : ''}><TabIcon d="M8 4h8M9 2h6v4H9zM6 4H5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-1M8 12l2.5 2.5L16 9" />秘書</a>
        <a href="#/coach" className={tab === 'coach' ? 'on' : ''}><TabIcon d="M2 9l10-5 10 5-10 5-10-5ZM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6" />先生</a>
        <a href="#/editor" className={tab === 'editor' ? 'on' : ''}><TabIcon d="M4 5h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5ZM18 9h2v9a1 1 0 0 1-2 0M8 9h6M8 13h6M8 17h3" />編集長</a>
      </nav>
      {route.tab !== 'settings' && (
        <a href="#/settings" className="gear" aria-label="設定"><TabIcon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-1-3-2 .2-1.3-1.4.2-2-3-1-1 2h-1.8l-1-2-3 1 .2 2L5 7.2 3 7l-1 3 2 1v2l-2 1 1 3 2-.2 1.3 1.4-.2 2 3 1 1-2h1.8l1 2 3-1-.2-2 1.3-1.4 2 .2 1-3-2-1Z" /></a>
      )}
    </>
  );
}

function TabIcon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

function Welcome() {
  return (
    <section className="card welcome">
      <h1>朝の5分へ、ようこそ</h1>
      <p>毎朝5時半に、あなた専用の配信が届きます。読むには、配信の置き場（非公開のリポジトリ）につなぐ設定が1回だけ必要です。</p>
      <a className="btn" href="#/settings">設定をはじめる</a>
    </section>
  );
}

function Empty() {
  return (
    <section className="card welcome">
      <h1>まだ配信がありません</h1>
      <p>最初の配信は、次の朝5時半ごろに届きます。</p>
    </section>
  );
}

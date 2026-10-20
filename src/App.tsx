import { useEffect, useState } from 'react';
import { cachedIds, fetchIds, flushAll, isConfigured } from './lib/data';
import { todayJst } from './lib/dates';
import { IssueView } from './ui/IssueView';
import { Past } from './ui/Past';
import { Settings } from './ui/Settings';
import { BriefView } from './ui/BriefView';

type Route = { tab: 'today' } | { tab: 'brief' } | { tab: 'past' } | { tab: 'issue'; id: string } | { tab: 'settings' };
const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, '');
  const m = h.match(/^issue\/(\d{4}-\d{2}-\d{2})$/);
  if (m) return { tab: 'issue', id: m[1] };
  return h === 'past' ? { tab: 'past' } : h === 'brief' ? { tab: 'brief' } : h === 'settings' ? { tab: 'settings' } : { tab: 'today' };
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
  const tab = route.tab === 'issue' ? 'past' : route.tab;

  let body;
  if (route.tab === 'settings') body = <Settings onSaved={() => { setConfigured(isConfigured()); }} />;
  else if (!configured) body = <Welcome />;
  else if (route.tab === 'brief') body = <BriefView />;
  else if (route.tab === 'past') body = <Past ids={ids} />;
  else if (route.tab === 'issue') body = <IssueView key={route.id} id={route.id} ids={ids} />;
  else if (latest) body = <IssueView key={latest} id={latest} ids={ids} />;
  else body = <Empty />;

  return (
    <>
      {offline && <div className="banner">オフラインです。保存済みの配信を表示しています。</div>}
      {error && <div className="banner banner-warn">{error}　<a href="#/settings">設定を確認</a></div>}
      <main className="main">{body}</main>
      <nav className="tabbar" aria-label="メニュー">
        <a href="#/" className={tab === 'today' ? 'on' : ''}><TabIcon d="M12 3v2M5.6 6.6l1.4 1.4M3 13h2M19 13h2M17 8l1.4-1.4M7 17a5 5 0 0 1 10 0M3 20h18" />今日</a>
        <a href="#/brief" className={tab === 'brief' ? 'on' : ''}><TabIcon d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1ZM8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2M8.5 12l2 2 4-4.5M8.5 17h7" />秘書</a>
        <a href="#/past" className={tab === 'past' ? 'on' : ''}><TabIcon d="M4 5h16M4 10h16M4 15h10M4 20h7" />過去</a>
        <a href="#/settings" className={tab === 'settings' ? 'on' : ''}><TabIcon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-1-3-2 .2-1.3-1.4.2-2-3-1-1 2h-1.8l-1-2-3 1 .2 2L5 7.2 3 7l-1 3 2 1v2l-2 1 1 3 2-.2 1.3 1.4-.2 2 3 1 1-2h1.8l1 2 3-1-.2-2 1.3-1.4 2 .2 1-3-2-1Z" />設定</a>
      </nav>
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

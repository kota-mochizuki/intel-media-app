import { formatDate, todayJst } from '../lib/dates';
import { lastDays } from '../lib/night';
import { BriefCard, toggleBriefDone, useBrief } from './BriefCard';
import { DueListTasks } from './ChecklistCard';
import { MinimumLine } from './MinimumLine';
import { UseCard } from './UseCard';
import { useFeedback } from './useFeedback';
import { WeatherCard } from './WeatherCard';
import { YesterdayCard } from './YesterdayCard';

/** 「秘書」タブ（アプリを開くと最初に出る）：天気の注意・昨日の振り返り・今日やること（秘書のタスク＋最低ライン＋期限の近いリスト）・見通し */
export function SecretaryView() {
  const today = todayJst();
  const yesterday = lastDays(today, 2)[1];
  const brief = useBrief(today);
  const { fb, update } = useFeedback(today);
  const extra = <><MinimumLine /><DueListTasks /></>;
  return (
    <div className="secretaryview">
      <header className="masthead masthead-brief">
        <div className="masthead-date">{formatDate(today)}</div>
        <div className="masthead-row"><span className="theme">秘書から</span></div>
      </header>
      <WeatherCard />
      <YesterdayCard day={yesterday} />
      {brief ? (
        <BriefCard compact brief={brief} fb={fb} onToggle={(i) => update((f) => toggleBriefDone(f, i))} extra={extra} />
      ) : (
        <section className="card brief">
          <h3 className="sec">今日やること</h3>
          <ul className="brief-today">{extra}</ul>
          <p className="small"><a href="#/lists">やることリストをすべて見る</a></p>
          <p className="muted small">秘書の報告は毎朝5時45分ごろに届きます。</p>
        </section>
      )}
      {brief && (brief.use || brief.referral) && <UseCard brief={brief} />}
    </div>
  );
}

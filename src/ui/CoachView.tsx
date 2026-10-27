import { formatDate, todayJst } from '../lib/dates';
import { StudyCard } from './StudyCard';
import { WikiView } from './WikiView';

/** 「先生」タブ：CFPの勉強のすべて。先生の一言と今日の過去問、その下にFP辞書 */
export function CoachView() {
  return (
    <div className="coachview">
      <header className="masthead masthead-brief">
        <div className="masthead-date">{formatDate(todayJst())}</div>
        <div className="masthead-row"><span className="theme">先生から</span><span className="muted small">CFP 2027年6月</span></div>
      </header>
      <StudyCard />
      <WikiView />
    </div>
  );
}

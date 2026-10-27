import { todayJst } from '../lib/dates';
import { planFor } from '../lib/study';
import { useStudy } from './useStudy';

/** 秘書タブの「今日やること」に混ぜる1行：先生の最低ライン（記録は先生タブで） */
export function MinimumLine() {
  const { data, st } = useStudy();
  if (!data) return null;
  const day = todayJst();
  const { book, first, done } = planFor(data.index, data.books, st, day);
  if (!first && !done) return null;
  return (
    <li>
      <a className={`min-row ${done ? 'is-done' : ''}`} href="#/coach">
        <span className="min-check" aria-hidden="true">{done ? '✓' : ''}</span>
        <span>{done ? 'CFPの過去問：今日の最低ラインは達成' : `CFPの過去問：${first!.label}の1つだけ（約${first!.it.stars.length * 3}分）`}
          <span className="brief-why">先生の最低ライン{book ? `・${book.name}` : ''}。記録は先生タブで</span></span>
      </a>
    </li>
  );
}

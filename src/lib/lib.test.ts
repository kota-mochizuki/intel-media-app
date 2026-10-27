import { describe, expect, it } from 'vitest';
import { formatDate, readMinutes, reflectionDay, themeOf, todayJst, weekday } from './dates';
import { emptyFeedback, setItem, starCount, unreadIds } from './feedback';
import { fromB64, toB64 } from './b64';
import type { Issue } from '../types';

describe('dates', () => {
  it('曜日とテーマ（端末のタイムゾーンに左右されない）', () => {
    expect(weekday('2026-10-21')).toBe(3);
    expect(themeOf('2026-10-23').name).toBe('デザインと文化');
    expect(formatDate('2026-10-25')).toBe('10月25日（日）');
  });
  it('日本時間の今日', () => {
    expect(todayJst(Date.parse('2026-10-20T20:30:00Z'))).toBe('2026-10-21');
  });
  it('読了の目安は最低1分', () => {
    const issue: Issue = { id: '2026-10-21', kind: 'daily', items: [] };
    expect(readMinutes(issue)).toBe(1);
  });
});

describe('feedback', () => {
  it('記事ごとの反応を、元を書き換えずに足す', () => {
    const a = emptyFeedback('2026-10-21');
    const b = setItem(setItem(a, '1', { star: true }), '1', { note: 'なるほど' });
    expect(a.items).toEqual({});
    expect(b.items['1']).toEqual({ star: true, note: 'なるほど' });
    expect(starCount(b)).toBe(1);
  });
  it('既読の記録がない間は、未読を数えない', () => {
    expect(unreadIds(['2026-10-22', '2026-10-21'], {}, '2026-10-23')).toEqual([]);
  });
  it('記録が始まってからの未読だけを数え、今日の分は数えない', () => {
    const fb = { ...emptyFeedback('2026-10-21'), read: true };
    const ids = ['2026-10-24', '2026-10-23', '2026-10-22', '2026-10-21', '2026-10-20'];
    expect(unreadIds(ids, { '2026-10-21': fb }, '2026-10-24')).toEqual(['2026-10-23', '2026-10-22']);
  });
});

describe('b64', () => {
  it('日本語を往復できる', () => {
    const s = JSON.stringify({ note: '朝の5分 ☆なるほど' });
    expect(fromB64(toB64(s))).toBe(s);
  });
});

import { phrases } from './phrases';
describe('phrases', () => {
  it('文節に分け、つなげると元に戻る。助詞は前の語に付く', () => {
    const t = '相談で「年収いくらまでなら」と聞くやり方は、もう古い。';
    const ps = phrases(t);
    expect(ps.join('')).toBe(t);
    expect(ps.length).toBeGreaterThan(3);
    expect(ps).toContain('やり方は、');
  });
  it('句読点やコロンで行が始まらない・1文字だけの文節を作らない', () => {
    for (const t of ['早く落ちる：運ぶ力', '1回に送り出す血液量：早期に低下し、運動習慣のない人と同じ水準に']) {
      const ps = phrases(t);
      expect(ps.join('')).toBe(t);
      for (const x of ps) { expect(x).not.toMatch(/^[、。：）」]/); expect(x.length).toBeGreaterThan(1); }
    }
    expect(phrases('1回に送り出す血液量：早期に低下し')).toContain('早期に');
  });
  it('開き括弧で文節が終わらない', async () => {
    const { tidy } = await import('./phrases');
    expect(tidy(['先に「', '2人の', '目標']).join('|')).toBe('先に|「2人の|目標');
    expect(tidy(['家計の話', '（', '私生活）と']).join('|')).toBe('家計の話|（私生活）と');
    expect(tidy(['出所は、', '金融専門家・機関5', '9%、', 'AI19%。']).join('|')).toBe('出所は、|金融専門家・機関59%、|AI19%。');
  });
  it('短いかぎ括弧の中は分けない', () => {
    const ps = phrases('相談のヒアリング項目に「週の所定労働時間」と「勤め先の従業員数」を足す。');
    expect(ps.some((x) => x.includes('「週の所定労働時間」'))).toBe(true);
    expect(ps.some((x) => x.includes('「勤め先の従業員数」'))).toBe(true);
  });
});

import { daysUntil, nextItems, progress } from './checklist';
import type { Checklist } from '../types';
describe('checklist', () => {
  const c: Checklist = { id: 'x', title: 't', target: '2026-11-22', sections: [
    { id: 's1', title: 'a', items: [
      { id: '1', text: 'あと', who: '2人', due: '2026-12-01' },
      { id: '2', text: '先', who: '2人', due: '2026-11-05' },
      { id: '3', text: '期限なし', who: '自分' },
      { id: '4', text: '済み', who: '自分', due: '2026-11-01' },
    ] },
  ] };
  it('日数の差と進み具合', () => {
    expect(daysUntil('2026-11-22', '2026-10-20')).toBe(33);
    expect(progress(c, { '4': true })).toEqual({ done: 1, total: 4 });
  });
  it('次の一手は、終わっていない項目を期限が近い順に。期限なしは最後', () => {
    expect(nextItems(c, { '4': true }, 3).map((i) => i.id)).toEqual(['2', '1', '3']);
  });
});

describe('秘書の報告：チェックと持ち越し', () => {
  it('チェックを切り替えても夜の振り返りは消えない', async () => {
    const { toggleBriefDone, setBrief } = await import('../ui/BriefCard');
    let f = setBrief(emptyFeedback('2026-10-21'), { memo: 'サウナで整った' });
    f = toggleBriefDone(f, 1);
    f = setBrief(f, { q: { lead: true, help: false } });
    expect(f.brief).toEqual({ done: [1], memo: 'サウナで整った', q: { lead: true, help: false } });
    f = toggleBriefDone(f, 1);
    expect(f.brief).toEqual({ done: [], memo: 'サウナで整った', q: { lead: true, help: false } });
  });
});


describe('夜の振り返りの日付', () => {
  it('朝4時までは前の日', () => {
    expect(reflectionDay(Date.parse('2026-10-21T15:30:00Z'))).toBe('2026-10-21'); // 10/22 0:30 JST
    expect(reflectionDay(Date.parse('2026-10-21T19:30:00Z'))).toBe('2026-10-22'); // 10/22 4:30 JST
    expect(reflectionDay(Date.parse('2026-10-21T13:00:00Z'))).toBe('2026-10-21'); // 10/21 22:00 JST
  });
});

import { lastDays, questionsFor, tally } from './night';
describe('夜の振り返りの集計', () => {
  it('直近7日と、問いごとのできた数', () => {
    expect(lastDays('2026-10-21', 3)).toEqual(['2026-10-21', '2026-10-20', '2026-10-19']);
    const t = tally([{ lead: true, help: false }, undefined, { lead: false }]);
    expect(t.lead).toEqual({ yes: 1, answered: 2 });
    expect(t.help).toEqual({ yes: 0, answered: 1 });
    expect(t.absorb).toEqual({ yes: 0, answered: 0 });
  });
  it('問いは5つ（期限なし）', () => expect(questionsFor('2026-12-01').map((x) => x.id)).toEqual(['lead', 'sincere', 'help', 'absorb', 'noregret']));

});

import { newToday, searchWiki } from './wiki';
describe('FP辞書', () => {
  const base = { large: 'L', summary: '', updated: '2026-10-22' };
  const list = [
    { ...base, id: 'risk.L10.M02', subject: 'risk', middle: '受取保険金と税金', title: '受取保険金と税金 ― 一時所得', created: '2026-10-22' },
    { ...base, id: 'tax.L01.M01', subject: 'tax', middle: '所得税の仕組み', title: '所得税', created: '2026-10-21' },
  ];
  it('検索は語をすべて含むもの、課目で絞れる', () => {
    expect(searchWiki(list, '一時所得', null).map((e) => e.id)).toEqual(['risk.L10.M02']);
    expect(searchWiki(list, '税', 'tax').map((e) => e.id)).toEqual(['tax.L01.M01']);
    expect(searchWiki(list, '', null)).toHaveLength(2);
  });
  it('今朝の項目は作成日が今日のもの', () => expect(newToday(list, '2026-10-22').map((e) => e.id)).toEqual(['risk.L10.M02']));
});

import { byTopic, currentBook, progress as studyProgress, todaySet } from './study';
import type { ChecksState, StudyBook } from '../types';
describe('紙の過去問', () => {
  const book: StudyBook = { id: 'risk', subject: 'risk', name: 'リスク', title: '', mock: { total: 50 }, items: [
    { no: 1, part: '', topic: 'A', level: '基', years: '', first: 1, stars: [1, 1] },
    { no: 2, part: '', topic: 'B', level: '基', years: '', first: 3, stars: [3, 3, 3] },
    { no: 3, part: '', topic: 'B', level: '中', years: '', first: 6, stars: [1, 1] },
    { no: 4, part: '', topic: 'C', level: '中', years: '', first: 8, stars: [2, 2, 2] },
  ] };
  const st = (x: Partial<ChecksState> = {}): ChecksState => ({ id: 'study', done: {}, updatedAt: '', ...x });
  it('今日の範囲は、申告済みのあとから目安の設問数まで（大問は切らない）', () => {
    expect(todaySet(book, st({ seeds: { risk: { upTo: 1, c: 2, n: 2, d: '' } } }), '2026-10-22', 4).map((i) => i.no)).toEqual([2, 3]);
  });
  it('今日記録した大問は、範囲に残る', () => {
    const s = st({ seeds: { risk: { upTo: 1, c: 2, n: 2, d: '' } }, scores: { 'risk-2': { c: 2, n: 3, d: '2026-10-22' } } });
    expect(todaySet(book, s, '2026-10-22', 4).map((i) => i.no)).toEqual([2, 3]);
    expect(todaySet(book, s, '2026-10-23', 4).map((i) => i.no)).toEqual([3, 4]);
  });
  it('進み具合と分野別（70%未満は復習）', () => {
    const s = st({ seeds: { risk: { upTo: 1, c: 1, n: 2, d: '' } }, scores: { 'risk-2': { c: 3, n: 3, d: 'x' }, 'risk-3': { c: 0, n: 2, d: 'x' }, 'risk-4': { c: 3, n: 3, d: 'x' } } });
    expect(studyProgress(book, s)).toEqual({ total: 10, done: 10, c: 7 });
    const t = byTopic(book, s);
    expect(t[0]).toMatchObject({ topic: 'B', c: 3, n: 5, review: true });
    expect(currentBook([book], ['risk'], s)).toBeNull();
  });
});

import { dailyTarget } from './study';
describe('1日の目安', () => {
  const book: StudyBook = { id: 'risk', subject: 'risk', name: '', title: '', mock: { total: 50 }, items: [
    { no: 1, part: '', topic: 'A', level: '', years: '', first: 1, stars: [1, 1, 1, 1, 1] },
    { no: 2, part: '', topic: 'B', level: '', years: '', first: 6, stars: [1, 1, 1, 1, 1] },
  ] };
  const st: ChecksState = { id: 'study', done: {}, updatedAt: '', scores: { 'risk-1': { c: 5, n: 5, d: '2026-10-30' } } };
  it('締切まで日割り、今日の記録で目安が変わらない', () => {
    expect(dailyTarget(book, st, '2026-10-30', '2026-10-31', 20)).toBe(5); // 残り10設問÷2日
    expect(dailyTarget(book, st, '2026-10-31', '2026-10-31', 20)).toBe(5);
    expect(dailyTarget(book, st, '2026-11-01', '2026-10-31', 20)).toBe(20);
  });
});

import { reviewSet } from './study';
describe('2周目の復習', () => {
  const book: StudyBook = { id: 'risk', subject: 'risk', name: 'リスク', title: '', mock: { total: 50 }, items: [
    { no: 1, part: '', topic: 'A', level: '', years: '', first: 1, stars: [1, 1, 1] },
    { no: 2, part: '', topic: 'B', level: '', years: '', first: 4, stars: [1, 1] },
  ] };
  const st = (scores: Record<string, { c: number; n: number; d: string }>): ChecksState => ({ id: 'study', done: {}, updatedAt: '', scores });
  it('間違えた大問は3日後に2回目、その10日後に3回目。開始日の前は出さない', () => {
    const s1 = st({ 'risk-1': { c: 1, n: 3, d: '2026-11-01' }, 'risk-2': { c: 2, n: 2, d: '2026-11-01' } });
    expect(reviewSet([book], s1, '2026-11-03', '2026-11-01', 2)).toHaveLength(0);
    expect(reviewSet([book], s1, '2026-11-04', '2026-11-01', 2).map((r) => [r.item.no, r.round])).toEqual([[1, 2]]);
    expect(reviewSet([book], s1, '2026-11-04', '2026-11-05', 2)).toHaveLength(0);
    const s2 = st({ ...s1.scores, 'risk-1#2': { c: 2, n: 3, d: '2026-11-04' } });
    expect(reviewSet([book], s2, '2026-11-04', '2026-11-01', 2).map((r) => r.round)).toEqual([2]); // 今日記録した分は残る
    expect(reviewSet([book], s2, '2026-11-13', '2026-11-01', 2)).toHaveLength(0);
    expect(reviewSet([book], s2, '2026-11-14', '2026-11-01', 2).map((r) => r.round)).toEqual([3]);
  });
});

import { studiedOn, touchedDays } from './study';
describe('過去問の最低ラインと続けた日数', () => {
  const st = { id: 'x', done: {}, updatedAt: '', scores: {
    'risk-1': { c: 1, n: 3, d: '2026-10-27' }, 'risk-2': { c: 3, n: 3, d: '2026-10-25' },
    'risk-3#2': { c: 2, n: 3, d: '2026-10-25' }, 'risk-4': { c: 0, n: 3, d: '2026-10-20' },
  } };
  it('1つでも記録した日は最低ライン達成（復習も数える）', () => {
    expect(studiedOn(st, '2026-10-27')).toBe(true);
    expect(studiedOn(st, '2026-10-26')).toBe(false);
  });
  it('直近7日で触れた日数（同じ日は1日、7日より前は数えない）', () => {
    expect(touchedDays(st, '2026-10-27')).toBe(2);
    expect(touchedDays(st, '2026-10-26')).toBe(2);
    expect(touchedDays({ ...st, scores: undefined }, '2026-10-27')).toBe(0);
  });
});

import { dueSoon } from './checklist';
describe('やることリスト：時期が来た項目', () => {
  const c = { id: 'x', title: 't', sections: [{ id: 's', title: 's', items: [
    { id: 'a', text: 'a', who: '本人', due: '2026-11-08' }, { id: 'b', text: 'b', who: '本人', due: '2026-11-03' },
    { id: 'c', text: 'c', who: '本人', due: '2026-10-25' }, { id: 'd', text: 'd', who: '本人' }, { id: 'e', text: 'e', who: '本人', due: '2026-10-30' },
  ] }] } as never;
  it('期限の7日前から出す（過ぎたものも出す、期限なしと済みは出さない、期限が近い順）', () => {
    expect(dueSoon(c, { e: true }, '2026-10-27').map((i) => i.id)).toEqual(['c', 'b']);
    expect(dueSoon(c, {}, '2026-11-01').map((i) => i.id)).toEqual(['c', 'e', 'b', 'a']);
  });
});

import { cautions, parseForecast, type Wx } from './weather';
describe('天気の注意', () => {
  const base: Wx = { date: '2026-10-27', code: 1, max: 20, min: 12, prevMax: 19, rainSum: 0, rainProb: 10, gust: 6, hourlyProb: [] };
  it('穏やかな日は何も出さない', () => expect(cautions(base)).toEqual([]));
  it('雨：傘と降り出しの時刻（6時以降で50%以上の最初の時間）', () => {
    const c = cautions({ ...base, rainProb: 80, rainSum: 4, hourlyProb: [{ hour: 3, p: 80 }, { hour: 7, p: 20 }, { hour: 15, p: 60 }] });
    expect(c).toEqual([{ level: '注意', text: '傘を持って出かけましょう（日中の降水確率60%、15時ごろから）' }]);
  });
  it('深夜だけの雨（雨量0mm）では傘を勧めない', () => {
    expect(cautions({ ...base, rainProb: 90, rainSum: 0, hourlyProb: [{ hour: 0, p: 90 }, { hour: 6, p: 53 }, { hour: 9, p: 25 }] })).toEqual([]);
  });
  it('大雨・強風・猛暑・冷え込み・寒暖差', () => {
    expect(cautions({ ...base, rainSum: 45 })[0].level).toBe('警戒');
    expect(cautions({ ...base, gust: 16 })[0].text).toContain('強い風');
    expect(cautions({ ...base, max: 36, prevMax: 34 })[0].text).toContain('猛暑日');
    expect(cautions({ ...base, min: -1 })[0].text).toContain('凍結');
    expect(cautions({ ...base, max: 12, prevMax: 20 })[0].text).toBe('昨日より最高気温が8℃低い（12℃）。服装の調整を');
  });
  it('Open-Meteo の返事から今日の分を取り出す', () => {
    const j = { daily: { time: ['2026-10-26', '2026-10-27'], weather_code: [3, 61], temperature_2m_max: [22, 15], temperature_2m_min: [14, 10], precipitation_sum: [0, 8], precipitation_probability_max: [5, 90], wind_gusts_10m_max: [5, 9] },
      hourly: { time: ['2026-10-26T23:00', '2026-10-27T08:00'], precipitation_probability: [0, 90] } };
    expect(parseForecast(j, '2026-10-27')).toMatchObject({ code: 61, max: 15, prevMax: 22, rainSum: 8, hourlyProb: [{ hour: 8, p: 90 }] });
    expect(parseForecast(j, '2026-10-28')).toBeNull();
  });
});

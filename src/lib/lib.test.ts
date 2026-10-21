import { describe, expect, it } from 'vitest';
import { formatDate, readMinutes, reflectionDay, themeOf, todayJst, weekday } from './dates';
import { emptyFeedback, setItem, starCount, unreadIds } from './feedback';
import { fromB64, toB64 } from './b64';
import type { Issue } from '../types';

describe('dates', () => {
  it('曜日とテーマ（端末のタイムゾーンに左右されない）', () => {
    expect(weekday('2026-10-21')).toBe(3);
    expect(themeOf('2026-10-23').name).toBe('週末の遊び');
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
    f = setBrief(f, { q: { cfp: true, yohaku: false } });
    expect(f.brief).toEqual({ done: [1], memo: 'サウナで整った', q: { cfp: true, yohaku: false } });
    f = toggleBriefDone(f, 1);
    expect(f.brief).toEqual({ done: [], memo: 'サウナで整った', q: { cfp: true, yohaku: false } });
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
    const t = tally([{ cfp: true, knee: false }, undefined, { cfp: false }]);
    expect(t.cfp).toEqual({ yes: 1, answered: 2 });
    expect(t.knee).toEqual({ yes: 0, answered: 1 });
    expect(t.yohaku).toEqual({ yes: 0, answered: 0 });
  });
  it('入籍の問いは入籍日まで', () => {
    expect(questionsFor('2026-11-22').some((x) => x.id === 'nyuseki')).toBe(true);
    expect(questionsFor('2026-11-23').some((x) => x.id === 'nyuseki')).toBe(false);
  });
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

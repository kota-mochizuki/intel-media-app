import { describe, expect, it } from 'vitest';
import { formatDate, readMinutes, themeOf, todayJst, weekday } from './dates';
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

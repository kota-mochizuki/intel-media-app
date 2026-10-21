import { useEffect, useRef, useState } from 'react';
import type { ChecksState, StudyBook, StudyIndex, StudyScore } from '../types';
import { cachedStudy, fetchStudy, flushChecks, loadChecks, localChecks, saveChecksLocal } from '../lib/data';

const ID = 'study';
/** 紙の過去問の本（目次）と、正答数の記録（checks/study.json）。入力はすぐ端末に控え、1秒後に送る */
export function useStudy() {
  const [data, setData] = useState<{ index: StudyIndex; books: StudyBook[] } | null>(cachedStudy);
  const empty = (): ChecksState => ({ id: ID, done: {}, updatedAt: new Date(0).toISOString() });
  const [st, setSt] = useState<ChecksState>(() => localChecks(ID) ?? empty());
  const ref = useRef(st);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    let off = false;
    fetchStudy().then((x) => { if (!off) setData(x); }).catch(() => { /* 控えのまま */ });
    loadChecks(ID).then((s) => { if (!off) { ref.current = s; setSt(s); } }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, []);
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void flushChecks(ID); } }, []);
  /** 大問の正答数を記録する。同じ値をもう一度押すと取り消し */
  const setScore = (key: string, sc: StudyScore) => {
    const scores = { ...ref.current.scores };
    if (scores[key]?.c === sc.c) delete scores[key]; else scores[key] = sc;
    const next: ChecksState = { ...ref.current, scores, updatedAt: new Date().toISOString() };
    ref.current = next; setSt(next); saveChecksLocal(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = undefined; void flushChecks(ID); }, 1000);
  };
  /** 模試の点数を足す */
  const addMock = (book: string, sc: StudyScore) => {
    const mocks = { ...ref.current.mocks, [book]: [...(ref.current.mocks?.[book] ?? []), sc] };
    const next: ChecksState = { ...ref.current, mocks, updatedAt: new Date().toISOString() };
    ref.current = next; setSt(next); saveChecksLocal(next);
    void flushChecks(ID);
  };
  return { data, st, setScore, addMock };
}

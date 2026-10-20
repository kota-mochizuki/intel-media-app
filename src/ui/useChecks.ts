import { useEffect, useRef, useState } from 'react';
import type { ChecksState } from '../types';
import { flushChecks, loadChecks, localChecks, saveChecksLocal } from '../lib/data';

/** リストのチェックの状態。押すとすぐ端末に控え、1秒後にまとめて送る */
export function useChecks(id: string) {
  const empty = (): ChecksState => ({ id, done: {}, updatedAt: new Date(0).toISOString() });
  const [st, setSt] = useState<ChecksState>(() => localChecks(id) ?? empty());
  const ref = useRef(st);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let off = false;
    loadChecks(id).then((s) => { if (!off) { ref.current = s; setSt(s); } }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, [id]);
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void flushChecks(id); } }, [id]);

  const toggle = (itemId: string) => {
    const done = { ...ref.current.done };
    if (done[itemId]) delete done[itemId]; else done[itemId] = true;
    const next: ChecksState = { ...ref.current, done, updatedAt: new Date().toISOString() };
    ref.current = next; setSt(next); saveChecksLocal(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = undefined; void flushChecks(id); }, 1000);
  };
  return { done: st.done, toggle };
}

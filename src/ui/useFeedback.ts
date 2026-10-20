import { useEffect, useRef, useState } from 'react';
import type { Feedback } from '../types';
import { flushFeedback, loadFeedback, localFeedback, saveFeedbackLocal, type SaveState } from '../lib/data';
import { emptyFeedback } from '../lib/feedback';

export type Status = 'idle' | 'saving' | SaveState;

/** 1つの配信へのフィードバック。入力はすぐ端末に控え、1秒後にまとめて送る */
export function useFeedback(id: string) {
  const [fb, setFb] = useState<Feedback>(() => localFeedback(id) ?? emptyFeedback(id));
  const [status, setStatus] = useState<Status>('idle');
  const ref = useRef(fb);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let off = false;
    loadFeedback(id).then((f) => { if (!off) { ref.current = f; setFb(f); } }).catch(() => { /* 控えのまま */ });
    return () => { off = true; };
  }, [id]);

  useEffect(() => () => {
    if (timer.current) { clearTimeout(timer.current); void flushFeedback(id); }
  }, [id]);

  const update = (fn: (f: Feedback) => Feedback) => {
    const next = { ...fn(ref.current), updatedAt: new Date().toISOString() };
    ref.current = next;
    setFb(next);
    saveFeedbackLocal(next);
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => { timer.current = undefined; setStatus(await flushFeedback(id)); }, 1000);
  };
  return { fb, update, status };
}

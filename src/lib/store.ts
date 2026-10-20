// 端末の控え（localStorage）。使えない環境でも落ちないように包む
export function get<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
export function set(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 容量不足など。控えが残らないだけ */ }
}
export function keys(prefix: string): string[] {
  try { return Object.keys(localStorage).filter((k) => k.startsWith(prefix)); } catch { return []; }
}
export function clearAll(prefix: string): void {
  for (const k of keys(prefix)) try { localStorage.removeItem(k); } catch { /* 無視 */ }
}

// 配信データの形（intel-media-data の README.md と同じ）
export interface Source { title: string; url: string; publisher: string; published: string }
export interface Insight { type: string; text: string }
export interface Polish { angle: string; change: string }
export interface Item {
  id: string; title: string; summary: string; why: string; action?: string;
  insight: Insight; polish: Polish[]; category: string; outside: boolean;
  sources: Source[]; recencyNote?: string;
}
export interface Bonus { type: string; body: string; answer?: string; source?: { title: string; url: string; publisher: string } }
export interface Issue { id: string; kind: 'daily' | 'deepdive' | 'digest'; note?: string; ask?: string; bonus?: Bonus; items: Item[] }

export interface ItemFeedback { star?: boolean; note?: string; done?: boolean }
export interface Feedback { id: string; read: boolean; note?: string; answer?: string; items: Record<string, ItemFeedback>; updatedAt: string }

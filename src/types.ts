// 配信データの形（intel-media-data の README.md と同じ）
export interface Source { title: string; url: string; publisher: string; published: string }
export interface Insight { type: string; text: string }
export interface Polish { angle: string; change: string }
// 図：ルーティンは数字や項目だけを書き、描くのはアプリ（数字が出典とずれない・色やダークモードに合う）
export interface FigureSource { publisher: string; published: string; url: string }
interface FigureBase { title: string; note?: string; source: FigureSource }
export type Figure =
  | (FigureBase & { type: 'bars'; unit?: string; bars: { label: string; value: number }[] })
  | (FigureBase & { type: 'flow'; steps: { label: string; detail?: string }[] })
  | (FigureBase & { type: 'compare'; columns: { heading: string; points: string[] }[] })
  | (FigureBase & { type: 'timeline'; events: { date: string; label: string }[] });
export interface BonusImage { url: string; alt: string; credit: string; license: string; page: string }

export interface Item {
  id: string; title: string; why: string; action?: string;
  points?: string[]; detail?: string; summary?: string; // summary は古い形式（points/detail 導入前）
  insight: Insight; polish: Polish[]; category: string; outside: boolean;
  sources: Source[]; recencyNote?: string; figure?: Figure;
}
export interface Bonus { type: string; body: string; answer?: string; image?: BonusImage; source?: { title: string; url: string; publisher: string } }
export interface Issue { id: string; kind: 'daily' | 'deepdive' | 'digest'; note?: string; ask?: string; bonus?: Bonus; items: Item[] }

export interface ItemFeedback { star?: boolean; note?: string; done?: boolean }
export interface Feedback { id: string; read: boolean; note?: string; answer?: string; items: Record<string, ItemFeedback>; updatedAt: string }

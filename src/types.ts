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

// 秘書の朝の報告（intel-media-data の briefs/）
export interface BriefTask { text: string; why?: string; due?: string }
export interface BriefHorizon { line: string; detail?: string }
export interface Brief {
  id: string; greeting?: string; evening?: string;
  today: BriefTask[]; week?: BriefTask[]; month?: BriefTask[];
  signals?: { area: string; level: '黄' | '赤'; text: string }[];
  horizon: { year: BriefHorizon; five: BriefHorizon; ten: BriefHorizon };
}

/** 秘書の報告への反応。done＝今日やることのチェック。夜の振り返り（q＝問いごとの できた/できなかった、memo＝ひとこと）は翌朝の秘書が読む */
export interface BriefFeedback { done: number[]; q?: Record<string, boolean>; memo?: string }
export interface ItemFeedback { star?: boolean; note?: string; done?: boolean }
export interface Feedback { id: string; read: boolean; note?: string; answer?: string; brief?: BriefFeedback; items: Record<string, ItemFeedback>; updatedAt: string }

// やることリスト（intel-media-data の lists/ と checks/）
export interface ListItem { id: string; text: string; who: string; due?: string; note?: string; source?: { title: string; url: string; publisher: string } }
export interface ListSection { id: string; title: string; items: ListItem[] }
export interface Checklist { id: string; title: string; target?: string; intro?: string; sections: ListSection[] }
export interface ChecksState { id: string; done: Record<string, boolean>; updatedAt: string; scores?: Record<string, StudyScore>; seeds?: Record<string, StudySeed>; mocks?: Record<string, StudyScore[]> }

// 紙の過去問（intel-media-data の study/ と checks/study.json）
export interface StudyScore { c: number; n: number; d: string }
export interface StudySeed extends StudyScore { upTo: number; note?: string }
export interface StudyItem { no: number; part: string; topic: string; level: string; years: string; first: number; stars: number[] }
export interface StudyBook { id: string; subject: string; name: string; title: string; mock: { total: number }; items: StudyItem[] }
export interface StudyIndex { books: string[]; order: string[]; dailyTarget: number }

// FP辞書（intel-media-data の wiki/）
export interface WikiPickup { type: 'タイムリー' | 'お客様に喜ばれる'; title: string; text?: string; date?: string; source?: { title: string; url: string; publisher: string } }
export interface WikiIndexItem { id: string; subject: string; large: string; middle: string; title: string; summary: string; created: string; updated: string; pickup?: WikiPickup }
export interface WikiEntry extends WikiIndexItem {
  sections: { heading: string; text: string }[];
  numbers?: { label: string; value: string; note?: string }[];
  exam: string; talk: string; related?: string[]; unconfirmed?: string[];
  sources: { title: string; url: string; publisher: string; date?: string }[];
}

// vite.config.ts の alias で BudouX の一部だけを読む（型は必要な分だけ書く）
declare module 'budoux-lite/parser' {
  export class Parser {
    constructor(model: Record<string, Record<string, number>>);
    parse(sentence: string): string[];
  }
}
declare module 'budoux-lite/ja' {
  export const model: Record<string, Record<string, number>>;
}

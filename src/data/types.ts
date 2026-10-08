export type Role = 'user' | 'admin';

export type SourceKind = 'text' | 'table' | 'deleted';

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  meta: string;
  before?: string;
  frag?: string;
  after?: string;
  /** Предупреждение о качестве источника, например скан. */
  note?: string;
}

export type AnswerType = 'list' | 'summary' | 'table' | 'status' | 'diverge' | 'empty' | 'deleted';

export interface Scenario {
  id: AnswerType;
  type: string; // подпись типа ответа
  tag: string; // короткая метка в истории
  question: string; // типовой вопрос
  sources: string[]; // id источников, порядок = нумерация сносок
  understood: string;
  asOf: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  scenario: AnswerType;
  at: number;
  /** Уточнение запроса: «pending» пока пользователь не ответил, потом выбранный объект и период. */
  clarify?: 'pending' | ClarifyScope;
}

export interface ClarifyScope {
  object: string;
  period: string;
}

export interface Filters {
  object: string;
  type: string;
  period: string;
}

export const NO_OBJECT = 'Без привязки к объекту';

export type DocStatus = 'ready' | 'processing' | 'queued' | 'error';

export interface DocRow {
  id: string;
  title: string;
  meta: string;
  object: string;
  type: string;
  date: string;
  by: string;
  status: DocStatus;
  note: string;
  progress?: number;
  action: string;
  trashed?: boolean;
}

export const DOC_STATUS: Record<DocStatus, { label: string; color: string }> = {
  ready: { label: 'Готов', color: '#147854' },
  processing: { label: 'Обрабатывается', color: '#9D5E13' },
  queued: { label: 'В очереди', color: '#4B607C' },
  error: { label: 'Ошибка чтения', color: '#B43B51' },
};

export const DOC_FILTER_MENUS = {
  object: { title: 'Объект', options: ['Все объекты', 'Вокзал ст. Заречная', 'Участок Речная — Горный', 'Депо Северное', 'Мост через р. Тихая', 'Без привязки к объекту'] },
  type: { title: 'Тип', options: ['Все типы', 'Приказ', 'Отчёт', 'Протокол', 'Методика', 'Таблицы и планы', 'Другое'] },
  period: { title: 'Период', options: ['Весь период', '2026', 'Сентябрь 2026', 'Август 2026', '2025'] },
  status: { title: 'Статус', options: ['Все статусы', 'Готов', 'Обрабатывается', 'В очереди', 'Ошибка чтения'] },
} as const;

export const DOCUMENTS: DocRow[] = [
  { id: 'd1', title: 'Отчёт о ходе строительства за сентябрь 2026', meta: 'PDF · 24 стр. · 3,8 МБ', object: 'Вокзал ст. Заречная', type: 'Отчёт', date: '03.10.2026', by: 'Е. Кузнецова', status: 'ready', note: 'Текст и 6 таблиц распознаны', action: 'Открыть' },
  { id: 'd2', title: 'Таблица ответственных по видам работ', meta: 'XLSX · 6 листов · 0,4 МБ', object: 'Вокзал ст. Заречная', type: 'Таблицы и планы', date: '30.09.2026', by: 'Е. Кузнецова', status: 'ready', note: 'Таблицы распознаны', action: 'Открыть' },
  { id: 'd3', title: 'Протокол штаба строительства от 25.09.2026', meta: 'PDF · 4 стр. · 0,6 МБ', object: 'Вокзал ст. Заречная', type: 'Протокол', date: '26.09.2026', by: 'А. Ткачёв', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd4', title: 'План реализации, ред. от 10.06.2026', meta: 'XLSX · 12 листов · 1,1 МБ', object: 'Вокзал ст. Заречная', type: 'Таблицы и планы', date: '11.06.2026', by: 'А. Ткачёв', status: 'ready', note: 'Есть более новый отчёт с другими сроками', action: 'Открыть' },
  { id: 'd5', title: 'Заключение экспертизы, рабочая документация', meta: 'PDF · скан · 3 стр. · 5,2 МБ', object: 'Вокзал ст. Заречная', type: 'Отчёт', date: '20.08.2026', by: 'А. Ткачёв', status: 'ready', note: 'Скан: подсветка фрагмента неточная', action: 'Открыть' },
  { id: 'd6', title: 'Акт скрытых работ, участок Речная — Горный', meta: 'PDF · скан · 18 стр. · 14,7 МБ', object: 'Участок Речная — Горный', type: 'Отчёт', date: '06.10.2026', by: 'Е. Кузнецова', status: 'processing', progress: 58, note: 'Распознавание: 58 %', action: 'Отменить' },
  { id: 'd7', title: 'Приказ № 301 о назначении ответственных', meta: 'DOCX · 2 стр. · 0,1 МБ', object: NO_OBJECT, type: 'Приказ', date: '06.10.2026', by: 'Е. Кузнецова', status: 'queued', note: 'Позиция в очереди: 3', action: 'Отменить' },
  { id: 'd8', title: 'Смета, благоустройство площади (скан)', meta: 'PDF · скан · 9 стр. · 22,0 МБ', object: 'Вокзал ст. Заречная', type: 'Таблицы и планы', date: '05.10.2026', by: 'А. Ткачёв', status: 'error', note: 'Страницы 4–6 нечитаемы', action: 'Повторить' },
  { id: 'd9', title: 'Приказ № 214 о порядке приёмки работ', meta: 'PDF · 3 стр. · 0,3 МБ', object: NO_OBJECT, type: 'Приказ', date: '12.08.2026', by: 'Е. Кузнецова', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd10', title: 'Методика ранжирования объектов, ред. 2026', meta: 'PDF · 31 стр. · 2,2 МБ', object: NO_OBJECT, type: 'Методика', date: '15.03.2026', by: 'А. Ткачёв', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd11', title: 'Отчёт о ходе строительства за август 2026', meta: 'PDF · 22 стр. · 3,5 МБ', object: 'Вокзал ст. Заречная', type: 'Отчёт', date: '02.09.2026', by: 'Е. Кузнецова', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd12', title: 'Протокол совещания по участку Речная — Горный', meta: 'PDF · 5 стр. · 0,7 МБ', object: 'Участок Речная — Горный', type: 'Протокол', date: '29.09.2026', by: 'Н. Борисова', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd13', title: 'График работ, депо Северное', meta: 'XLSX · 3 листа · 0,5 МБ', object: 'Депо Северное', type: 'Таблицы и планы', date: '18.09.2026', by: 'А. Ткачёв', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd14', title: 'Отчёт по обследованию опор моста', meta: 'PDF · 40 стр. · 8,4 МБ', object: 'Мост через р. Тихая', type: 'Отчёт', date: '10.09.2026', by: 'Н. Борисова', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd15', title: 'Скан без названия 0412.pdf', meta: 'PDF · скан · 2 стр. · 1,9 МБ', object: NO_OBJECT, type: 'Другое', date: '04.10.2026', by: 'Е. Кузнецова', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd16', title: 'Протокол штаба строительства от 18.09.2026', meta: 'PDF · 3 стр. · 0,4 МБ', object: 'Вокзал ст. Заречная', type: 'Протокол', date: '19.09.2026', by: 'А. Ткачёв', status: 'ready', note: '', action: 'Открыть' },
  { id: 'd17', title: 'Приказ № 188 (устарел, заменён № 301)', meta: 'DOCX · 2 стр. · 0,1 МБ', object: NO_OBJECT, type: 'Приказ', date: '01.06.2026', by: 'Е. Кузнецова', status: 'ready', note: '', action: 'Открыть', trashed: true },
];

export const OBJECTS = ['Вокзал ст. Заречная', 'Участок Речная — Горный', 'Депо Северное', 'Мост через р. Тихая', NO_OBJECT] as const;
export const OTHER_TYPE = 'Другое';
export const DOC_TYPES = ['Приказ', 'Отчёт', 'Протокол', 'Методика', 'Таблицы и планы', OTHER_TYPE] as const;

/** Подсказка системы по названию файла: объект и тип. Администратор подтверждает или правит. */
export function suggestMeta(name: string): { object: string; type: string } {
  const n = name.toLowerCase();
  const object =
    /вокзал|заречн/.test(n) ? OBJECTS[0]
    : /речная|горн|участ/.test(n) ? OBJECTS[1]
    : /депо|северн/.test(n) ? OBJECTS[2]
    : /мост|тих/.test(n) ? OBJECTS[3]
    : NO_OBJECT;
  const type =
    /приказ/.test(n) ? 'Приказ'
    : /отч[её]т/.test(n) ? 'Отчёт'
    : /протокол/.test(n) ? 'Протокол'
    : /методик/.test(n) ? 'Методика'
    : /план|смет|график|таблиц|\.xlsx?$/.test(n) ? 'Таблицы и планы'
    : OTHER_TYPE;
  return { object, type };
}

/** Сколько ответов ссылаются на документ (для демо, стабильное число по id). */
export function usedIn(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 7;
  return h;
}

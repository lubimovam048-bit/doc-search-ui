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
}

export const DOC_STATUS: Record<DocStatus, { label: string; color: string }> = {
  ready: { label: 'Готов', color: '#2AB4AE' },
  processing: { label: 'Обрабатывается', color: '#FF8A00' },
  queued: { label: 'В очереди', color: '#999EA7' },
  error: { label: 'Ошибка чтения', color: '#FF4D4D' },
};

export const DOC_FILTER_MENUS = {
  object: { title: 'Объект', options: ['Все объекты', 'Вокзал ст. Заречная', 'Участок Речная — Горный', 'Депо Северное', 'Мост через р. Тихая'] },
  type: { title: 'Тип', options: ['Все типы', 'Приказ', 'Отчёт', 'Протокол', 'Методика', 'Таблицы и планы'] },
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
  { id: 'd7', title: 'Приказ № 301 о назначении ответственных', meta: 'DOCX · 2 стр. · 0,1 МБ', object: 'Все объекты', type: 'Приказ', date: '06.10.2026', by: 'Е. Кузнецова', status: 'queued', note: 'Позиция в очереди: 3', action: 'Отменить' },
  { id: 'd8', title: 'Смета, благоустройство площади (скан)', meta: 'PDF · скан · 9 стр. · 22,0 МБ', object: 'Вокзал ст. Заречная', type: 'Таблицы и планы', date: '05.10.2026', by: 'А. Ткачёв', status: 'error', note: 'Страницы 4–6 нечитаемы', action: 'Повторить' },
];

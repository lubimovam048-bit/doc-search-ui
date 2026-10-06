import type { Filters } from './types';

export type FilterKey = keyof Filters;

export const FILTER_MENUS: Record<FilterKey, { title: string; options: string[] }> = {
  object: { title: 'Объект', options: ['Все объекты', 'Вокзал ст. Заречная', 'Участок Речная — Горный', 'Депо Северное', 'Мост через р. Тихая'] },
  type: { title: 'Тип документа', options: ['Все типы', 'Приказы', 'Отчёты', 'Протоколы', 'Методики', 'Таблицы и планы'] },
  period: { title: 'Период', options: ['Весь период', '2026', 'Сентябрь 2026', 'Август 2026', '2025'] },
};

export const DEFAULT_FILTERS: Filters = { object: 'Все объекты', type: 'Все типы', period: 'Весь период' };

export const SAVED_SCOPES: { name: string; filters: Filters }[] = [
  { name: 'Заречная: отчёты 2026', filters: { object: 'Вокзал ст. Заречная', type: 'Отчёты', period: '2026' } },
  { name: 'Приказы 2026, вся сеть', filters: { object: 'Все объекты', type: 'Приказы', period: '2026' } },
  { name: 'Речная — Горный: протоколы', filters: { object: 'Участок Речная — Горный', type: 'Протоколы', period: 'Весь период' } },
  { name: 'Методики, вся база', filters: { object: 'Все объекты', type: 'Методики', period: 'Весь период' } },
];

export function isFilterActive(filters: Filters, key: FilterKey): boolean {
  return filters[key] !== FILTER_MENUS[key].options[0];
}

export function describeScope(filters: Filters): string {
  const parts = (Object.keys(FILTER_MENUS) as FilterKey[])
    .filter((k) => isFilterActive(filters, k))
    .map((k) => filters[k]);
  return parts.length ? parts.join(', ') : 'вся база';
}

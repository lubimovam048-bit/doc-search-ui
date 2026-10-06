import { useState } from 'react';
import { describeScope, isFilterActive, FILTER_MENUS, type FilterKey } from '../data/filters';
import type { Filters } from '../data/types';
import FilterBar from './FilterBar';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

/** По умолчанию поиск идёт по всей базе. Фильтры скрыты за одной ссылкой. */
export default function ScopeControl({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const any = (Object.keys(FILTER_MENUS) as FilterKey[]).some((k) => isFilterActive(filters, k));
  return (
    <div className="scope">
      {open && <FilterBar filters={filters} onChange={onChange} openUp />}
      <button className="btn-link t-b25 scope__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? 'Скрыть уточнение' : any ? `Область: ${describeScope(filters)}` : 'Уточнить область поиска'}
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FILTERS, FILTER_MENUS, SAVED_SCOPES, isFilterActive, type FilterKey,
} from '../data/filters';
import type { Filters } from '../data/types';
import Icon from './Icon';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

type MenuKey = FilterKey | 'saved' | null;

/** Область поиска: фильтры по атрибутам и сохранённые области вместо длинного списка групп. */
export default function FilterBar({ filters, onChange }: Props) {
  const [menu, setMenu] = useState<MenuKey>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const keys = Object.keys(FILTER_MENUS) as FilterKey[];
  const anyActive = keys.some((k) => isFilterActive(filters, k));

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const toggle = (k: MenuKey) => setMenu((m) => (m === k ? null : k));

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <div className="hstack hstack--8">
        {keys.map((k) => {
          const active = isFilterActive(filters, k);
          return (
            <button key={k} className={`pill${active || menu === k ? ' pill--active' : ''}`} onClick={() => toggle(k)} aria-expanded={menu === k}>
              {active ? `${FILTER_MENUS[k].title}: ${filters[k]}` : FILTER_MENUS[k].title}
              <Icon name="chevDown" size={14} stroke={1.8} />
            </button>
          );
        })}
        <button className={`pill${menu === 'saved' ? ' pill--active' : ''}`} onClick={() => toggle('saved')} aria-expanded={menu === 'saved'}>
          Сохранённые области
          <Icon name="chevDown" size={14} stroke={1.8} />
        </button>
        {anyActive && (
          <button className="btn-text t-btn2" onClick={() => onChange(DEFAULT_FILTERS)}>Сбросить</button>
        )}
      </div>

      {menu && (
        <div className="card2 menu" role="menu">
          <span className="t-b25 c3 menu__title">{menu === 'saved' ? 'Сохранённые области' : FILTER_MENUS[menu].title}</span>
          <div className="menu__list">
            {menu === 'saved' ? (
              <>
                {SAVED_SCOPES.map((s) => (
                  <button key={s.name} className="menu__item" onClick={() => { onChange(s.filters); setMenu(null); }}>
                    <span>{s.name}</span>
                  </button>
                ))}
                <button className="menu__item menu__item--accent" onClick={() => setMenu(null)}>Сохранить текущую область…</button>
              </>
            ) : (
              FILTER_MENUS[menu].options.map((o) => {
                const sel = filters[menu] === o;
                return (
                  <button key={o} className={`menu__item${sel ? ' menu__item--on' : ''}`} onClick={() => { onChange({ ...filters, [menu]: o }); setMenu(null); }}>
                    <span>{o}</span>
                    {sel && <Icon name="check" size={16} stroke={2} color="var(--green)" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

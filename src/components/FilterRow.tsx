import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export interface MenuDef<K extends string> {
  key: K;
  title: string;
  options: readonly string[];
  value: string;
  /** подпись на кнопке в неактивном состоянии, по умолчанию — заголовок */
  label?: (value: string, active: boolean) => string;
}

interface Props<K extends string> {
  menus: MenuDef<K>[];
  onChange: (key: K, value: string) => void;
  /** дополнительные кнопки в строке фильтров */
  extra?: React.ReactNode;
  /** меню раскрывается вправо от края */
  alignRight?: boolean;
}

/** Строка фильтров с выпадающими списками для таблиц администратора. */
export default function FilterRow<K extends string>({ menus, onChange, extra, alignRight }: Props<K>) {
  const [open, setOpen] = useState<K | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = menus.find((m) => m.key === open);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="hstack hstack--8">
        {extra}
        {menus.map((m) => {
          const active = m.value !== m.options[0];
          const text = m.label ? m.label(m.value, active) : active ? `${m.title}: ${m.value}` : m.title;
          return (
            <button key={m.key} className={`pill${active || open === m.key ? ' pill--active' : ''}`} onClick={() => setOpen(open === m.key ? null : m.key)} aria-expanded={open === m.key}>
              {text}
              <Icon name="chevDown" size={14} stroke={1.8} />
            </button>
          );
        })}
      </div>
      {current && (
        <div className={`card2 menu${alignRight ? ' menu--right' : ''}`} style={{ width: 320 }}>
          <span className="t-b25 c3 menu__title">{current.title}</span>
          <div className="menu__list">
            {current.options.map((o) => {
              const sel = current.value === o;
              return (
                <button key={o} className={`menu__item${sel ? ' menu__item--on' : ''}`} onClick={() => { onChange(current.key, o); setOpen(null); }}>
                  <span>{o}</span>
                  {sel && <Icon name="check" size={16} stroke={2} color="var(--er-color-primary)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

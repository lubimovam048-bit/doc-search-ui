import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FEATURES } from '../config';
import { useApp } from '../context/AppContext';
import type { HistoryEntry } from '../data/types';
import Icon from './Icon';

const DAY = 24 * 60 * 60 * 1000;

/** Группы истории: сегодня, вчера, ранее. */
function groupHistory(items: HistoryEntry[]) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const t = start.getTime();
  const groups: { label: string; items: HistoryEntry[] }[] = [
    { label: 'Сегодня', items: [] },
    { label: 'Вчера', items: [] },
    { label: 'Ранее', items: [] },
  ];
  for (const h of items) groups[h.at >= t ? 0 : h.at >= t - DAY ? 1 : 2].items.push(h);
  return groups.filter((g) => g.items.length > 0);
}

/** Левое меню: новый чат, разделы, история запросов, пользователь. */
export default function Sidebar({ open, onNavigate }: { open?: boolean; onNavigate?: () => void }) {
  const { role, setRole, history, clearHistory, navRail, toggleNav } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const meRef = useRef<HTMLDivElement>(null);
  const isAdmin = role === 'admin';
  const rail = navRail;

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => meRef.current && !meRef.current.contains(e.target as Node) && setMenu(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const link = ({ isActive }: { isActive: boolean }) => `snav${isActive ? ' snav--on' : ''}`;

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}${rail ? ' sidebar--rail' : ''}`} aria-label="Меню">
      <div className="sidebar__head">
        {!rail && <NavLink to="/" className="sidebar__title" onClick={onNavigate}>Поиск по документам</NavLink>}
        <button className="sidebar__collapse" onClick={toggleNav} aria-label={rail ? 'Развернуть меню' : 'Свернуть меню'}>
          <Icon name={rail ? 'expand' : 'collapse'} size={16} />
        </button>
      </div>

      <button className="snav snav--new" onClick={() => { navigate('/'); onNavigate?.(); }} title="Новый чат">
        <Icon name="plus" size={18} />{!rail && <span>Новый чат</span>}
      </button>

      {isAdmin && (
        <>
          <NavLink to="/files" className={link} onClick={onNavigate} title="Документы">
            <Icon name="folder" size={18} />{!rail && <span>Документы</span>}
          </NavLink>
          {FEATURES.journal && (
            <NavLink to="/journal" className={link} onClick={onNavigate} title="Журнал">
              <Icon name="journal" size={18} />{!rail && <span>Журнал</span>}
            </NavLink>
          )}
        </>
      )}

      {!rail && (
        <div className="history" aria-label="История запросов">
          {history.length === 0 && <span className="history__none">Пока нет запросов. Здесь появятся ваши вопросы.</span>}
          {groupHistory(history).map((g) => (
            <div key={g.label} className="history__group">
              <span className="history__label">{g.label}</span>
              {g.items.map((h) => {
                const active = pathname === `/q/${h.id}`;
                return (
                  <button key={h.id} className={`history__item${active ? ' history__item--active' : ''}`} onClick={() => { navigate(`/q/${h.id}`); onNavigate?.(); }} aria-current={active ? 'page' : undefined} title={h.query}>
                    {h.query}
                  </button>
                );
              })}
            </div>
          ))}
          {history.length > 0 && (
            <button className="history__clear" onClick={() => { clearHistory(); navigate('/'); }}>Очистить историю (демо)</button>
          )}
        </div>
      )}

      <div className="sidebar__foot" ref={meRef}>
        <button className="me" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-haspopup="menu" title={isAdmin ? 'Администратор' : 'Сотрудник'}>
          <span className="avatar" aria-hidden="true">{isAdmin ? 'АК' : 'ЕК'}</span>
          {!rail && (
            <span className="me__text">
              <b>{isAdmin ? 'Администратор' : 'Сотрудник'}</b>
              <span>{isAdmin ? 'Управление документами' : 'Поиск и просмотр'}</span>
            </span>
          )}
        </button>
        {menu && (
          <div className="menu menu--up menu--me" role="menu">
            <span className="t-b25 c3 menu__title">Роль в демо</span>
            {(['user', 'admin'] as const).map((r) => (
              <button key={r} role="menuitemradio" aria-checked={role === r} className={`menu__item${role === r ? ' menu__item--on' : ''}`} onClick={() => { setRole(r); setMenu(false); if (r === 'user' && pathname !== '/' && !pathname.startsWith('/q/')) navigate('/'); }}>
                <span>{r === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                {role === r && <Icon name="check" size={16} stroke={2} color="var(--er-color-primary)" />}
              </button>
            ))}
            <span className="t-cap1 c3 menu__title">Макетные данные, не реальные документы</span>
          </div>
        )}
      </div>
    </aside>
  );
}

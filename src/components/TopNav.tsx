import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FEATURES } from '../config';
import { useApp } from '../context/AppContext';
import Icon from './Icon';

export default function TopNav() {
  const { role, setRole } = useApp();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = role === 'admin';
  const assistantActive = pathname === '/' || pathname.startsWith('/q/');

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const tab = ({ isActive }: { isActive: boolean }) => `tab${isActive ? ' tab--on' : ''}`;

  return (
    <header className="topnav">
      <NavLink to="/" className="topnav__brand" aria-label="Поиск по документам, на главную">
        <span className="badge"><Icon name="doc" /></span>
        <span className="t-sub3">Поиск по документам</span>
      </NavLink>

      <nav className="topnav__tabs" aria-label="Разделы">
        <NavLink to="/" end className={() => `tab${assistantActive ? ' tab--on' : ''}`}>Ассистент</NavLink>
        {isAdmin && (
          <>
            <NavLink to="/files" className={tab}>Файлы</NavLink>
            {FEATURES.journal && <NavLink to="/journal" className={tab}>Журнал</NavLink>}
          </>
        )}
      </nav>

      <div className="topnav__me" ref={ref}>
        <button className="me" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
          <span className="t-b25 c3 me__role">{isAdmin ? 'Администратор' : 'Пользователь'}</span>
          <span className="avatar" aria-hidden="true">{isAdmin ? 'АК' : 'ЕК'}</span>
        </button>
        {open && (
          <div className="menu menu--right menu--me" role="menu">
            <span className="t-b25 c3 menu__title">Роль в демо</span>
            {(['user', 'admin'] as const).map((r) => (
              <button key={r} role="menuitemradio" aria-checked={role === r} className={`menu__item${role === r ? ' menu__item--on' : ''}`} onClick={() => { setRole(r); setOpen(false); }}>
                <span>{r === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                {role === r && <Icon name="check" size={16} stroke={2} color="var(--er-color-primary)" />}
              </button>
            ))}
            <span className="t-cap1 c3 menu__title">Макетные данные, не реальные документы</span>
          </div>
        )}
      </div>
    </header>
  );
}

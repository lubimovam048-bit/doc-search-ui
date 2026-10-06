import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SCENARIOS } from '../data/scenarios';
import Icon from './Icon';

export default function Sidebar() {
  const { role, setRole, navRail, toggleNav, history, clearHistory } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  const linkClass = ({ isActive }: { isActive: boolean }) => `nav${isActive ? ' nav--active' : ''}`;

  if (navRail) {
    const railClass = ({ isActive }: { isActive: boolean }) => `nav nav--rail${isActive ? ' nav--active' : ''}`;
    return (
      <aside className="card1 sidebar sidebar--rail">
        <button className="btn-icon" onClick={toggleNav} aria-label="Развернуть панель"><Icon name="chevRight" size={20} /></button>
        <NavLink to="/" end className={railClass} aria-label="Поиск"><Icon name="search" size={20} /></NavLink>
        <button className="nav nav--rail" style={{ background: 'transparent', border: 0 }} onClick={toggleNav} aria-label="История запросов">
          <Icon name="clock" size={20} />
        </button>
        {isAdmin && (
          <>
            <NavLink to="/documents" className={railClass} aria-label="Документы"><Icon name="doc" size={20} /></NavLink>
            <NavLink to="/journal" className={railClass} aria-label="Журнал запросов"><Icon name="list" size={20} /></NavLink>
          </>
        )}
      </aside>
    );
  }

  return (
    <aside className="card1 sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-main">
          <div className="badge"><Icon name="doc" /></div>
          <div className="stack stack--4" style={{ minWidth: 0 }}>
            <span className="t-sub3 c1">Поиск по документам</span>
            <span className="t-cap1 c3">Внутренняя система</span>
          </div>
        </div>
        <button className="btn-icon" onClick={toggleNav} aria-label="Свернуть панель"><Icon name="chevLeft" /></button>
      </div>

      <nav className="sidebar__nav" aria-label="Разделы">
        <NavLink to="/" end className={linkClass}><Icon name="search" />Поиск</NavLink>
        {isAdmin && (
          <>
            <span className="t-b3 c3 sidebar__group">Администрирование</span>
            <NavLink to="/documents" className={linkClass}><Icon name="doc" />Документы</NavLink>
            <NavLink to="/journal" className={linkClass}><Icon name="list" />Журнал запросов</NavLink>
          </>
        )}
      </nav>

      <div className="history">
        <span className="t-b3 c3 history__label">Мои запросы</span>
        {history.length === 0 ? (
          <div className="history__empty">
            <Icon name="clock" size={20} color="var(--text-3)" />
            <span className="t-b25 c2">Пока нет запросов</span>
            <span className="t-cap1 c3">Здесь появятся ваши вопросы. Их также видит администратор.</span>
          </div>
        ) : (
          <>
            {history.map((h) => {
              const active = pathname === `/q/${h.id}`;
              return (
                <button
                  key={h.id}
                  className={`history__item${active ? ' history__item--active' : ''}`}
                  onClick={() => navigate(`/q/${h.id}`)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="t-b25" style={{ color: active ? '#fff' : undefined }}>{h.query}</span>
                  <span className="t-b3 c3">{SCENARIOS[h.scenario].tag}</span>
                </button>
              );
            })}
            <button className="btn-text t-b3" style={{ textAlign: 'left' }} onClick={() => { clearHistory(); navigate('/'); }}>
              Очистить историю (демо)
            </button>
          </>
        )}
      </div>

      <div className="sidebar__foot">
        <span className="t-cap1 c3">Роль в демо</span>
        <div className="segmented t-btn2" role="group" aria-label="Роль в демо">
          <button aria-pressed={!isAdmin} onClick={() => setRole('user')}>Пользователь</button>
          <button aria-pressed={isAdmin} onClick={() => setRole('admin')}>Администратор</button>
        </div>
        <span className="t-cap1 c3">Макетные данные, не реальные документы</span>
      </div>
    </aside>
  );
}

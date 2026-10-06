import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SCENARIOS } from '../data/scenarios';
import Icon from './Icon';

/** Левая панель экрана «Ассистент»: только история запросов. */
export default function Sidebar() {
  const { history, clearHistory } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="sidebar" aria-label="История запросов">
      <div className="history">
        <span className="t-b3 c3 history__label">Мои запросы</span>
        {history.length === 0 ? (
          <div className="history__empty">
            <Icon name="clock" size={20} color="var(--er-color-subtle)" />
            <span className="t-b25 c2">Пока нет запросов</span>
            <span className="t-cap1 c3">Здесь появятся ваши вопросы. Их также видит администратор.</span>
          </div>
        ) : (
          <>
            {history.map((h) => {
              const active = pathname === `/q/${h.id}`;
              return (
                <button key={h.id} className={`history__item${active ? ' history__item--active' : ''}`} onClick={() => navigate(`/q/${h.id}`)} aria-current={active ? 'page' : undefined}>
                  <span className="t-b25" style={{ fontWeight: active ? 600 : undefined }}>{h.query}</span>
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
    </aside>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScopeControl from '../components/ScopeControl';
import SearchField from '../components/SearchField';
import { useApp } from '../context/AppContext';
import { DEFAULT_FILTERS } from '../data/filters';
import { SCENARIOS } from '../data/scenarios';

const CHIPS = [SCENARIOS.status.question, SCENARIOS.table.question, SCENARIOS.list.question];

/** Стартовый экран: один вопрос, одно поле. Всё остальное спрятано. */
export default function HomePage() {
  const { ask } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const go = (q: string) => navigate(`/q/${ask(q).id}`);

  return (
    <main className="welcome">
      <div className="welcome__hero">
        <h1 className="t-h1 welcome__title">Найдите ответ в документах</h1>
        <p className="t-b1 welcome__lead">
          Задайте вопрос своими словами. Ответ будет со ссылками на документы.
        </p>
        <div className="chips" aria-label="Примеры вопросов">
          {CHIPS.map((c) => (
            <button key={c} className="chip" onClick={() => go(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="welcome__composer">
        <SearchField onSubmit={go} autoFocus />
        <ScopeControl filters={filters} onChange={setFilters} />
        <span className="t-cap1 c3 welcome__note">Запросы сохраняются и доступны администратору.</span>
      </div>
    </main>
  );
}

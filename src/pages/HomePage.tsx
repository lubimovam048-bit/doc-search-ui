import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import SearchField from '../components/SearchField';
import { useApp } from '../context/AppContext';
import { DEFAULT_FILTERS } from '../data/filters';

/** Стартовый экран в композиции ИИ-ассистента: заголовок по центру, поле запроса внизу. */
export default function HomePage() {
  const { ask } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  return (
    <main className="welcome">
      <div className="welcome__hero">
        <h1 className="t-h3 c1 welcome__title">Найдите ответ в документах</h1>
        <p className="t-b1 c2 welcome__lead">
          Задайте вопрос своими словами или введите номер приказа. Ответ будет со ссылками на документы-источники.
        </p>
      </div>

      <div className="welcome__composer">
        <FilterBar filters={filters} onChange={setFilters} openUp />
        <SearchField onSubmit={(q) => navigate(`/q/${ask(q).id}`)} autoFocus />
        <span className="t-cap1 c3 welcome__note">Запросы сохраняются и доступны администратору.</span>
      </div>
    </main>
  );
}

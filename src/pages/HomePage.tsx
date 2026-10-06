import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import Icon, { type IconName } from '../components/Icon';
import SearchField from '../components/SearchField';
import { useApp } from '../context/AppContext';
import { DEFAULT_FILTERS } from '../data/filters';
import { EXAMPLE_QUERIES } from '../data/scenarios';

const HOW_IT_WORKS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'doc', title: 'Ответ только по документам', text: 'Система отвечает на основе загруженных документов. Нет документов по теме — ответа не будет.' },
  { icon: 'link', title: 'Каждый вывод со ссылкой', text: 'Справа откроются источники: страница, фрагмент и документ целиком.' },
  { icon: 'list', title: 'Расхождения не скрываются', text: 'Если документы противоречат друг другу, вы увидите оба значения со ссылками.' },
];

/** Стартовый экран. Для нового пользователя (история пуста) показывает короткое объяснение. */
export default function HomePage() {
  const { ask, history } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const firstVisit = history.length === 0;

  const run = (q: string) => navigate(`/q/${ask(q).id}`);

  return (
    <main className="welcome">
      <div className="welcome__inner">
        <div className="stack stack--12" style={{ alignItems: 'flex-start' }}>
          <div className="badge badge--lg"><Icon name="search" size={24} /></div>
          <h1 className="t-h3 c1" style={{ fontWeight: 300, margin: 0 }}>Найдите ответ в документах</h1>
          <span className="t-b1 c2" style={{ lineHeight: '24px' }}>
            Задайте вопрос своими словами или введите номер приказа. Ответ будет со ссылками на документы-источники.
          </span>
        </div>

        <SearchField onSubmit={run} autoFocus />

        <div className="hstack hstack--8">
          <span className="t-b25 c3" style={{ paddingRight: 4 }}>Область поиска</span>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        <div className="stack stack--12">
          <span className="t-b25 c3">Примеры запросов</span>
          <div className="hstack hstack--8">
            {EXAMPLE_QUERIES.map((q) => (
              <button key={q} className="ghost t-b25 chip-btn" onClick={() => run(q)}>{q}</button>
            ))}
          </div>
        </div>

        {firstVisit && (
          <div className="welcome__cards">
            {HOW_IT_WORKS.map((c) => (
              <div key={c.title} className="card1 welcome__card rise">
                <div className="badge"><Icon name={c.icon} /></div>
                <span className="t-sub3 c1">{c.title}</span>
                <span className="t-b25 c2" style={{ lineHeight: '20px' }}>{c.text}</span>
              </div>
            ))}
          </div>
        )}

        <span className="t-cap1 c3">
          Запросы сохраняются и доступны администратору.{firstVisit ? ' Свою историю вы видите слева.' : ''}
        </span>
      </div>
    </main>
  );
}

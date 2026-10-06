import { useNavigate } from 'react-router-dom';
import SearchField from '../components/SearchField';
import { useApp } from '../context/AppContext';

/** Стартовый экран: один вопрос, одно поле. Всё остальное спрятано. */
export default function HomePage() {
  const { ask } = useApp();
  const navigate = useNavigate();
  const go = (q: string) => navigate(`/q/${ask(q).id}`);

  return (
    <main className="welcome">
      <div className="welcome__hero">
        <h1 className="t-h1 welcome__title">Найдите ответ в документах</h1>
        <p className="t-b1 welcome__lead">
          Задайте вопрос своими словами. Ответ будет со ссылками на документы.
        </p>
      </div>

      <div className="welcome__composer">
        <SearchField onSubmit={go} autoFocus />
        <span className="t-cap1 c3 welcome__note">Запросы сохраняются и доступны администратору.</span>
      </div>
    </main>
  );
}

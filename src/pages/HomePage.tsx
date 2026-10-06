import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import SearchField from '../components/SearchField';
import { useApp } from '../context/AppContext';

/** Стартовый экран: один вопрос, одно поле. */
export default function HomePage() {
  const { ask } = useApp();
  const navigate = useNavigate();

  return (
    <main className="welcome">
      <div className="welcome__hero">
        <span className="welcome__tag"><i />Ответы только по загруженным документам</span>
        <h1 className="welcome__title">Найдите ответ<br />в документах</h1>
        <p className="welcome__lead">Задайте вопрос своими словами. Каждый ответ со ссылкой на документ-источник.</p>

        <div className="welcome__composer">
          <SearchField onSubmit={(q) => navigate(`/q/${ask(q).id}`)} autoFocus />
        </div>

        <div className="hints">
          <div className="hint">
            <Icon name="help" size={22} stroke={1.5} />
            <div><b>Как спрашивать</b><span>Обычными словами или номером приказа. Название объекта указывать необязательно.</span></div>
          </div>
          <div className="hint">
            <Icon name="link" size={22} stroke={1.5} />
            <div><b>Откуда ответ</b><span>Рядом с каждым фактом номер источника. Нажмите, чтобы открыть документ.</span></div>
          </div>
        </div>
      </div>
      <span className="t-cap1 c3 welcome__note">Запросы сохраняются и доступны администратору.</span>
    </main>
  );
}

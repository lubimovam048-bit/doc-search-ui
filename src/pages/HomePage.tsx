import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchField from '../components/SearchField';
import WelcomeBackground, { type WelcomeBackgroundHandle } from '../components/WelcomeBackground';
import { useApp } from '../context/AppContext';

const CARDS = [
  'Какие последние изменения внёс Шилов А. В.?',
  'Найди все документы по объекту за последние 2 месяца',
  'Что решили по срокам поставки металлоконструкций?',
];

/** Стартовый экран: один вопрос, одно поле. */
export default function HomePage() {
  const { ask } = useApp();
  const navigate = useNavigate();
  const bg = useRef<WelcomeBackgroundHandle>(null);
  const lastInput = useRef(0);

  const go = (q: string) => navigate(`/q/${ask(q).id}`);

  return (
    <main className="welcome">
      <WelcomeBackground ref={bg} />
      <div className="welcome__hero">
        <h1 className="welcome__title">Ваш ИИ-помощник<br />вместо сотни страниц</h1>

        <div className="qcards">
          {CARDS.map((q) => (
            <button key={q} type="button" className="qcard" onClick={() => { bg.current?.pulse(false); go(q); }}>{q}</button>
          ))}
        </div>

        <div
          className="welcome__composer"
          onInput={() => {
            const n = performance.now();
            if (n - lastInput.current > 420) { lastInput.current = n; bg.current?.pulse(false); }
          }}
          onFocus={() => bg.current?.pulse(false)}
          onSubmit={() => bg.current?.pulse(true)}
        >
          <SearchField onSubmit={go} autoFocus />
        </div>
      </div>
      <span className="t-cap1 c3 welcome__note">Запросы сохраняются и доступны администратору.</span>
    </main>
  );
}

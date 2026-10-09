import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchField, { type SearchFieldHandle } from '../components/SearchField';
import WelcomeBackground, { type WelcomeBackgroundHandle } from '../components/WelcomeBackground';
import { useApp } from '../context/AppContext';
import DocRing, { type DocRingHandle } from '../features/welcome/DocRing';

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
  const field = useRef<SearchFieldHandle>(null);
  const docs = useRef<DocRingHandle>(null);
  const lastInput = useRef(0);

  const go = (q: string) => navigate(`/q/${ask(q).id}`);

  return (
    <main className="welcome">
      <WelcomeBackground ref={bg} />
      <DocRing ref={docs} />
      <section className="welcome__panel">
        <h1 className="welcome__title">Ваш ИИ-помощник<br />вместо сотни страниц</h1>

        <div className="qcards">
          {CARDS.map((q) => (
            <button key={q} type="button" className="qcard" onClick={() => { bg.current?.pulse(false); docs.current?.burst(); field.current?.ask(q); }}>{q}</button>
          ))}
        </div>

        <div
          className="welcome__composer"
          onInput={() => {
            const n = performance.now();
            if (n - lastInput.current > 420) { lastInput.current = n; bg.current?.pulse(false); }
          }}
          onFocus={() => { bg.current?.pulse(false); docs.current?.burst(); }}
        >
          <SearchField ref={field} onSubmit={go} onStart={() => { bg.current?.pulse(true); docs.current?.burst(); }} />
        </div>
      </section>
      <span className="t-cap1 c3 welcome__note">Запросы сохраняются и доступны администратору.</span>
    </main>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { EXAMPLE_QUERIES } from '../data/scenarios';
import { useTypewriter } from '../hooks/useTypewriter';
import Icon from './Icon';

interface Props {
  onSubmit: (query: string) => void;
  autoFocus?: boolean;
}

const THINKING_MS = 2400;
const STATUSES = ['Ищу в документах…', 'Сверяю источники…', 'Формирую ответ со ссылками…'];

/** Поле запроса: полупрозрачный луч по контуру и «печатающиеся» подсказки в пустом поле. */
export default function SearchField({ onSubmit, autoFocus }: Props) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const timers = useRef<number[]>([]);
  const hint = useTypewriter(EXAMPLE_QUERIES, { enabled: value === '' && !thinking && !focused });

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || thinking) return;
    // поле сворачивается в «шарик ожидания», затем показываем ответ
    setThinking(true);
    setStatusIdx(0);
    timers.current = [
      window.setTimeout(() => setStatusIdx(1), THINKING_MS / 3),
      window.setTimeout(() => setStatusIdx(2), (THINKING_MS / 3) * 2),
      window.setTimeout(() => {
        setThinking(false);
        setValue('');
        onSubmit(q);
      }, THINKING_MS),
    ];
  };

  return (
    <div className="search-wrap">
      <form className={`search${thinking ? ' search--thinking' : ''}`} onSubmit={submit} role="search" aria-busy={thinking}>
        <div className="search__content" aria-hidden={thinking}>
          <Icon name="search" size={20} color="var(--er-color-subtle)" />
          <div className="search__field">
            <input
              className={`search__input t-b1${value === '' ? ' search__input--empty' : ''}`}
              type="text"
              aria-label="Запрос"
              autoComplete="off"
              autoFocus={autoFocus}
              value={value}
              disabled={thinking}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <div className={`search__ghost t-b1${value ? ' search__ghost--hidden' : ''}`} aria-hidden="true">
              <span>{focused ? '' : hint}</span>
              {(focused || hint) && <span className="search__caret" />}
            </div>
          </div>
          <button type="submit" className="btn-p t-btn2" tabIndex={thinking ? -1 : 0}>Найти<Icon name="arrow" size={16} stroke={2} /></button>
        </div>
        <div className="orb" aria-hidden="true" />
      </form>
      <span className={`search__status t-b25 c2${thinking ? ' search__status--on' : ''}`} role="status">
        {thinking ? STATUSES[statusIdx] : ''}
      </span>
    </div>
  );
}

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { EXAMPLE_QUERIES } from '../data/scenarios';
import { useTypewriter } from '../hooks/useTypewriter';
import Icon from './Icon';

interface Props {
  onSubmit: (query: string) => void;
  /** Вызывается в момент, когда поле начинает сворачиваться в шарик. */
  onStart?: (query: string) => void;
  autoFocus?: boolean;
}

/** Пауза между подстановкой выбранного вопроса и сворачиванием в шарик. */
const PICK_MS = 450;
const THINKING_MS = 2400;

export interface SearchFieldHandle {
  /** Подставляет вопрос в поле и запускает поиск, как после нажатия «Найти». */
  ask: (query: string) => void;
}
const STATUSES = ['Ищу в документах…', 'Сверяю источники…', 'Формирую ответ со ссылками…'];

/** Поле запроса: полупрозрачный луч по контуру и «печатающиеся» подсказки в пустом поле. */
const SearchField = forwardRef<SearchFieldHandle, Props>(function SearchField({ onSubmit, onStart, autoFocus }, ref) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const timers = useRef<number[]>([]);
  const hint = useTypewriter(EXAMPLE_QUERIES, { enabled: value === '' && !thinking && !focused });

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const busy = useRef(false);

  // поле сворачивается в «шарик ожидания», затем показываем ответ
  const run = (q: string) => {
    if (busy.current) return;
    busy.current = true;
    onStart?.(q);
    setThinking(true);
    setStatusIdx(0);
    timers.current = [
      window.setTimeout(() => setStatusIdx(1), THINKING_MS / 3),
      window.setTimeout(() => setStatusIdx(2), (THINKING_MS / 3) * 2),
      window.setTimeout(() => {
        busy.current = false;
        setThinking(false);
        setValue('');
        onSubmit(q);
      }, THINKING_MS),
    ];
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) run(q);
  };

  // Enter запускает поиск так же, как кнопка «Найти»
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const q = value.trim();
    if (q) run(q);
  };

  useImperativeHandle(ref, () => ({
    ask: (q: string) => {
      if (busy.current) return;
      setValue(q);
      timers.current.push(window.setTimeout(() => run(q), PICK_MS));
    },
  }));

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
              onKeyDown={onKeyDown}
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
});

export default SearchField;

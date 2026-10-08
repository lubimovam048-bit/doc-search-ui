import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { DOCUMENTS, OBJECTS } from '../../data/documents';
import type { ClarifyScope } from '../../data/types';

export const ALL_OBJECTS = 'Все объекты';
export const ALL_PERIOD = 'Весь период';
const OWN = '__own';

interface Option { value: string; hint: string }
const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'документ' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'документа' : 'документов');

const PERIODS: Option[] = [
  { value: 'Последний месяц', hint: 'с 03.09.2026' },
  { value: 'С начала 2026 года', hint: 'с 01.01.2026' },
  { value: ALL_PERIOD, hint: 'все загруженные документы' },
];

interface Props {
  initial?: ClarifyScope;
  onDone: (scope: ClarifyScope) => void;
  onCancel?: () => void;
}

/** Уточняющие вопросы до ответа: один вопрос на шаг, варианты строками с пояснением, выбор мышью, цифрами или стрелками. */
export default function Clarify({ initial, onDone, onCancel }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [object, setObject] = useState(initial?.object ?? '');
  const [period, setPeriod] = useState(initial?.period ?? '');
  const [own, setOwn] = useState('');

  const objects = useMemo<Option[]>(() => {
    const live = DOCUMENTS.filter((d) => !d.trashed);
    return [
      ...OBJECTS.slice(0, 4).map((o) => {
        const n = live.filter((d) => d.object === o).length;
        return { value: o, hint: `${n} ${plural(n)}` };
      }),
      { value: ALL_OBJECTS, hint: `${live.length} ${plural(live.length)}` },
    ];
  }, []);

  const q = step === 0
    ? { tag: 'Объект', title: 'По какому объекту искать?', options: objects, value: object, set: setObject, placeholder: 'Название объекта' }
    : { tag: 'Период', title: 'За какой период?', options: PERIODS, value: period, set: setPeriod, placeholder: 'Например: сентябрь 2026' };
  const choice = q.value === OWN ? own.trim() : q.value;
  const ready = choice.length > 0;

  const next = () => {
    if (!ready) return;
    if (step === 0) { setObject(choice); setStep(1); setOwn(''); }
    else onDone({ object, period: choice });
  };
  const skip = () => onDone({ object: step === 1 && object ? object : ALL_OBJECTS, period: ALL_PERIOD });

  // клавиатура: цифры выбирают вариант, стрелки двигают выбор, Enter подтверждает
  useEffect(() => {
    const all = [...q.options.map((o) => o.value), OWN];
    const onKey = (e: KeyboardEvent) => {
      const inInput = (e.target as HTMLElement).tagName === 'INPUT';
      if (e.key === 'Enter') { if (ready) { e.preventDefault(); next(); } return; }
      if (inInput) return;
      const n = Number(e.key);
      if (n >= 1 && n <= all.length) { e.preventDefault(); q.set(all[n - 1]); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const i = all.indexOf(q.value);
        const j = e.key === 'ArrowDown' ? Math.min(all.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
        q.set(all[j]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <section className="clar" aria-label="Уточнение запроса">
      <div className="clar__head">
        <span className="clar__tag">{q.tag}</span>
        <span className="clar__step">{step + 1} из 2</span>
      </div>
      <h2 className="clar__q">{q.title}</h2>
      <div className="clar__list" role="radiogroup" aria-label={q.title}>
        {q.options.map((o, i) => {
          const on = q.value === o.value;
          return (
            <button key={o.value} role="radio" aria-checked={on} className={`clar__row${on ? ' clar__row--on' : ''}`} onClick={() => q.set(o.value)}>
              <span className="clar__n">{i + 1}</span>
              <span className="clar__text"><b>{o.value}</b><span>{o.hint}</span></span>
              {on && <Icon name="check" size={18} stroke={2.2} className="clar__check" />}
            </button>
          );
        })}
        <div className={`clar__row clar__row--own${q.value === OWN ? ' clar__row--on' : ''}`} role="radio" aria-checked={q.value === OWN} tabIndex={0} onClick={() => q.set(OWN)} onKeyDown={(e) => e.key === ' ' && e.target === e.currentTarget && q.set(OWN)}>
          <span className="clar__n">{q.options.length + 1}</span>
          <span className="clar__text">
            <b>Другое</b>
            {q.value === OWN
              ? <input className="clar__own" autoFocus placeholder={q.placeholder} value={own} onChange={(e) => setOwn(e.target.value)} />
              : <span>Свой вариант</span>}
          </span>
          {q.value === OWN && ready && <Icon name="check" size={18} stroke={2.2} className="clar__check" />}
        </div>
      </div>
      <div className="clar__foot">
        <span className="clar__keys">1–{q.options.length + 1} выбрать · Enter подтвердить</span>
        {step === 1 && <button className="btn-text t-btn2" onClick={() => setStep(0)}>Назад</button>}
        {onCancel && <button className="btn-text t-btn2" onClick={onCancel}>Отмена</button>}
        <button className="btn-text t-btn2" onClick={skip}>Пропустить</button>
        <button className="btn-p t-btn2" disabled={!ready} onClick={next}>{step === 0 ? 'Продолжить' : 'Найти'}</button>
      </div>
    </section>
  );
}

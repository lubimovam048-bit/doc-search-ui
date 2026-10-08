import { useState } from 'react';
import Icon from '../../components/Icon';
import { OBJECTS } from '../../data/documents';
import type { ClarifyScope } from '../../data/types';

export const ALL_OBJECTS = 'Все объекты';
export const ALL_PERIOD = 'Весь период';
const OBJECT_OPTIONS = [...OBJECTS.slice(0, 4), ALL_OBJECTS];
const PERIOD_OPTIONS = ['Последний месяц', 'С начала 2026 года', ALL_PERIOD];
const OWN = '__own';

interface Props {
  initial?: ClarifyScope;
  onDone: (scope: ClarifyScope) => void;
  onCancel?: () => void;
}

/** Уточняющие вопросы до ответа: два шага, выбор одного варианта, «Свой вариант» и пропуск. */
export default function Clarify({ initial, onDone, onCancel }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [object, setObject] = useState(initial?.object ?? '');
  const [period, setPeriod] = useState(initial?.period ?? '');
  const [own, setOwn] = useState('');

  const q = step === 0
    ? { title: 'По какому объекту искать?', options: OBJECT_OPTIONS, value: object, set: setObject }
    : { title: 'За какой период?', options: PERIOD_OPTIONS, value: period, set: setPeriod };
  const choice = q.value === OWN ? own.trim() : q.value;
  const ready = choice.length > 0;

  const next = () => {
    if (!ready) return;
    if (step === 0) {
      setObject(choice);
      setStep(1);
      setOwn('');
    } else {
      onDone({ object: object === OWN ? own.trim() : object, period: choice });
    }
  };

  return (
    <section className="clar" aria-label="Уточнение запроса">
      <div className="clar__head">
        <span className="clar__lead">Уточните, чтобы я нашла точнее</span>
        <span className="clar__step">{step + 1} из 2</span>
      </div>
      <h2 className="clar__q">{q.title}</h2>
      <div className="clar__opts" role="radiogroup" aria-label={q.title}>
        {q.options.map((o) => (
          <button key={o} role="radio" aria-checked={q.value === o} className={`clar__opt${q.value === o ? ' clar__opt--on' : ''}`} onClick={() => q.set(o)}>
            <span className="clar__radio" aria-hidden="true">{q.value === o && <Icon name="check" size={12} stroke={2.4} />}</span>{o}
          </button>
        ))}
        <button role="radio" aria-checked={q.value === OWN} className={`clar__opt${q.value === OWN ? ' clar__opt--on' : ''}`} onClick={() => q.set(OWN)}>
          <span className="clar__radio" aria-hidden="true">{q.value === OWN && <Icon name="check" size={12} stroke={2.4} />}</span>Свой вариант
        </button>
      </div>
      {q.value === OWN && (
        <input className="clar__own" autoFocus placeholder={step === 0 ? 'Название объекта' : 'Например: сентябрь 2026'} value={own} onChange={(e) => setOwn(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next()} />
      )}
      <div className="clar__foot">
        <button className="btn-p t-btn2" disabled={!ready} onClick={next}>{step === 0 ? 'Продолжить' : 'Найти'}</button>
        {step === 1 && <button className="btn-text t-btn2" onClick={() => setStep(0)}>Назад</button>}
        <button className="btn-text t-btn2 clar__skip" onClick={() => onDone({ object: object && object !== OWN ? object : ALL_OBJECTS, period: ALL_PERIOD })}>Пропустить и искать везде</button>
        {onCancel && <button className="btn-text t-btn2" onClick={onCancel}>Отмена</button>}
      </div>
    </section>
  );
}

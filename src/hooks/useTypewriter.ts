import { useEffect, useRef, useState } from 'react';

interface Options {
  typeMs?: number;
  eraseMs?: number;
  holdMs?: number;
  pauseMs?: number;
  enabled?: boolean;
}

/**
 * «Печатает» подсказки по очереди: набрала, подержала, стёрла, следующая.
 * Последняя подсказка не стирается и остаётся в поле.
 * Если анимацию приостановили (поле в фокусе), она продолжается с того же места.
 * При включённом «уменьшении движения» сразу возвращает последнюю подсказку целиком.
 */
export function useTypewriter(phrases: string[], opts: Options = {}): string {
  const { typeMs = 110, eraseMs = 40, holdMs = 1800, pauseMs = 600, enabled = true } = opts;
  const last = phrases.length - 1;
  const [text, setText] = useState('');
  // ход анимации хранится между запусками эффекта
  const progress = useRef({ idx: 0, len: 0, erasing: false, done: false });

  useEffect(() => {
    if (!enabled || phrases.length === 0) return;
    const p = progress.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || p.done) {
      p.done = true;
      setText(phrases[last]);
      return;
    }

    let timer: number;
    const tick = () => {
      const phrase = phrases[p.idx];
      if (!p.erasing) {
        p.len += 1;
        setText(phrase.slice(0, p.len));
        if (p.len >= phrase.length) {
          if (p.idx === last) { p.done = true; return; }
          p.erasing = true;
          timer = window.setTimeout(tick, holdMs);
          return;
        }
        // небольшой разброс, чтобы набор выглядел живым
        timer = window.setTimeout(tick, typeMs + Math.round((Math.random() - 0.5) * typeMs * 0.6));
      } else {
        p.len -= 1;
        setText(phrase.slice(0, p.len));
        if (p.len <= 0) {
          p.erasing = false;
          p.idx += 1;
          timer = window.setTimeout(tick, pauseMs);
          return;
        }
        timer = window.setTimeout(tick, eraseMs);
      }
    };

    timer = window.setTimeout(tick, pauseMs);
    return () => window.clearTimeout(timer);
  }, [phrases, enabled, last, typeMs, eraseMs, holdMs, pauseMs]);

  return text;
}

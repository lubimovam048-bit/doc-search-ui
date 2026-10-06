import { useEffect, useState } from 'react';

interface Options {
  typeMs?: number;
  eraseMs?: number;
  holdMs?: number;
  pauseMs?: number;
  enabled?: boolean;
}

/**
 * «Печатает» и стирает подсказки по кругу.
 * При включённом «уменьшении движения» возвращает первую подсказку целиком.
 */
export function useTypewriter(phrases: string[], opts: Options = {}): string {
  const { typeMs = 55, eraseMs = 24, holdMs = 2600, pauseMs = 500, enabled = true } = opts;
  const [text, setText] = useState('');

  useEffect(() => {
    if (!enabled || phrases.length === 0) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setText(phrases[0]);
      return;
    }

    let timer: number;
    let phraseIdx = 0;
    let len = 0;
    let erasing = false;

    const tick = () => {
      const phrase = phrases[phraseIdx];
      if (!erasing) {
        len += 1;
        setText(phrase.slice(0, len));
        if (len >= phrase.length) {
          erasing = true;
          timer = window.setTimeout(tick, holdMs);
          return;
        }
        timer = window.setTimeout(tick, typeMs);
      } else {
        len -= 1;
        setText(phrase.slice(0, len));
        if (len <= 0) {
          erasing = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          timer = window.setTimeout(tick, pauseMs);
          return;
        }
        timer = window.setTimeout(tick, eraseMs);
      }
    };

    timer = window.setTimeout(tick, pauseMs);
    return () => window.clearTimeout(timer);
  }, [phrases, enabled, typeMs, eraseMs, holdMs, pauseMs]);

  return text;
}

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { RESP_TABLE, SOURCES } from '../../data/sources';
import { createRing, type DocRing as Ring, type RingItem } from './ringEngine';

export interface DocRingHandle {
  /** Документы рассыпаются и исчезают до обновления страницы. */
  burst: () => void;
}

// после первого разлёта кольцо больше не появляется, пока страницу не обновят
let dismissed = false;

/** Поле коротко вспыхивает, когда в него падает стопка. */
function glow() {
  document.querySelector('.welcome__panel .search')?.animate(
    [
      { boxShadow: '0 0 0 0 rgba(36,93,223,0)' },
      { boxShadow: '0 0 0 4px rgba(36,93,223,.16), 0 0 26px rgba(36,93,223,.32)', offset: 0.35 },
      { boxShadow: '0 0 0 0 rgba(36,93,223,0)' },
    ],
    { duration: 600, easing: 'ease-out' },
  );
}

const IDS = ['s_method', 's_order', 's_resp', 's_protocol', 's_rep7', 's_letter'];

function items(): RingItem[] {
  return IDS.map((id) => {
    const s = SOURCES[id];
    const m = /стр\.\s*(\d+)/.exec(s.meta);
    const base = { title: s.title, page: m ? `СТР. ${m[1]}` : '', kind: (s.kind === 'table' ? 'XLS' : 'PDF') as 'PDF' | 'XLS' };
    if (s.kind === 'table') {
      const hl = RESP_TABLE.rows.findIndex((r) => r.hl);
      return {
        ...base,
        table: {
          head: [RESP_TABLE.head[0], RESP_TABLE.head[1], RESP_TABLE.head[3]],
          rows: RESP_TABLE.rows.map((r) => [r.work, r.who, r.due.slice(0, 5)]),
          hl,
        },
      };
    }
    return { ...base, before: s.before, frag: s.frag, after: s.after };
  });
}

/** Кольцо документов за плашкой стартового экрана. */
const DocRing = forwardRef<DocRingHandle>(function DocRing(_, ref) {
  const host = useRef<HTMLDivElement>(null);
  const ring = useRef<Ring | null>(null);

  useEffect(() => {
    if (dismissed || !host.current) return;
    ring.current = createRing(host.current, items(), {
      target: () => document.querySelector('.welcome__panel .search'),
      onArrive: glow,
    });
    return () => { ring.current?.destroy(); ring.current = null; };
  }, []);

  useImperativeHandle(ref, () => ({
    burst() {
      if (dismissed || !ring.current) return;
      dismissed = true;
      ring.current.burst();
    },
  }));

  return <div className="welcome__ring" ref={host} aria-hidden="true" />;
});

export default DocRing;

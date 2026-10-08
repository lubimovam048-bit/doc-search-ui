import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { RESP_TABLE } from '../../data/sources';
import type { Source } from '../../data/types';

interface Props {
  sources: Source[];
  current: Source;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const pageInfo = (s: Source) => {
  const m = /стр\.\s*(\d+)\s*из\s*(\d+)/.exec(s.meta);
  return m ? { n: m[1], total: m[2] } : null;
};

/** Документ справа от ответа: страница с выделенным найденным фрагментом. */
export default function DocPane({ sources, current, onSelect, onClose }: Props) {
  const [big, setBig] = useState(false);
  const i = sources.findIndex((x) => x.id === current.id);
  const pg = pageInfo(current);
  const go = (d: number) => {
    const next = sources[(i + d + sources.length) % sources.length];
    if (next) onSelect(next.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside className="docpane" aria-label={`Документ: ${current.title}`}>
      <div className="docpane__head">
        <span className="scard__ext">{current.kind === 'table' ? 'XLS' : 'PDF'}</span>
        <div className="docpane__titles">
          <b>{current.title}</b>
          <span>{current.meta}</span>
        </div>
        <div className="docpane__tools">
          {sources.length > 1 && (
            <>
              <button onClick={() => go(-1)} aria-label="Предыдущий источник" title="Предыдущий источник"><Icon name="chevUp" size={16} /></button>
              <button onClick={() => go(1)} aria-label="Следующий источник" title="Следующий источник"><Icon name="chevDown" size={16} /></button>
            </>
          )}
          <button onClick={() => setBig((v) => !v)} aria-pressed={big} aria-label="Увеличить текст" title="Увеличить текст"><Icon name="zoom" size={16} /></button>
          <button onClick={onClose} aria-label="Закрыть документ" title="Закрыть"><Icon name="x" size={16} /></button>
        </div>
      </div>

      <div className="docpane__body">
        <div className={`docpage${big ? ' docpage--big' : ''}`}>
          <div className="docpage__top">
            <span className="docpage__no">{pg ? `СТР. ${pg.n}` : ''}</span>
            <span className="docpage__found">Найден 1 фрагмент</span>
          </div>
          {current.kind === 'text' && (
            <>
              <h3 className="docpage__title">{current.title.toUpperCase()}</h3>
              <p>{current.before}</p>
              <p><mark>{current.frag}</mark></p>
              <p>{current.after}</p>
              <span className="paper__line" /><span className="paper__line paper__line--s" /><span className="paper__line" />
            </>
          )}
          {current.kind === 'table' && (
            <div className="src__table">
              <table>
                <thead><tr>{RESP_TABLE.head.map((h) => <th key={h} className="t-btn2 c2">{h}</th>)}</tr></thead>
                <tbody>
                  {RESP_TABLE.rows.map((r) => (
                    <tr key={r.work} className={r.hl ? 'hl' : ''}>
                      <td className="t-b25">{r.work}</td>
                      <td className="t-b25">{r.hl ? <span className="cell-mark">{r.who}</span> : r.who}</td>
                      <td className="t-b25">{r.control}</td>
                      <td className="t-b25">{r.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <span className="docpage__hint">Макет просмотра: здесь откроется оригинал документа.</span>
        </div>
      </div>
    </aside>
  );
}

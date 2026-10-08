import { RESP_TABLE } from '../../data/sources';
import type { Source } from '../../data/types';

interface Props {
  sources: Source[];
  activeId: string | null;
  onOpen: (id: string) => void;
}

const page = (s: Source) => /стр\.\s*(\d+)/.exec(s.meta)?.[1];
const badge = (s: Source) => (s.kind === 'table' ? 'XLS' : 'PDF');

/** Источники под ответом: фрагмент в контексте, ключевая фраза выделена. Вся карточка открывает документ. */
export default function SourceCards({ sources, activeId, onOpen }: Props) {
  if (sources.length === 0) return null;
  return (
    <section className="srcs" aria-label="Источники">
      <h2 className="srcs__title">Источники <span>{sources.length}</span></h2>
      {sources.map((s, i) => {
        const del = s.kind === 'deleted';
        const pg = page(s);
        return (
          <article key={s.id} id={`src-${s.id}`} className={`scard${activeId === s.id ? ' scard--on' : ''}${del ? ' scard--del' : ''}`}>
            <button className="scard__head" onClick={() => !del && onOpen(s.id)} disabled={del} aria-label={del ? `${s.title}: документ удалён` : `Открыть: ${s.title}`}>
              <span className={`cn${del ? ' cn--del' : activeId === s.id ? ' cn--on' : ''}`}>{i + 1}</span>
              <span className="scard__ext">{del ? 'DOC' : badge(s)}</span>
              <span className="scard__name">{s.title}</span>
              <span className="scard__meta">{del ? 'удалён' : pg ? `стр. ${pg}` : ''}</span>
            </button>
            {s.kind === 'text' && (
              <button className="scard__body" onClick={() => onOpen(s.id)} tabIndex={-1} aria-hidden="true">
                <span className="scard__ctx">{s.before}</span>
                <span className="scard__key">{s.frag}</span>
                <span className="scard__ctx">{s.after}</span>
              </button>
            )}
            {s.kind === 'table' && (
              <button className="scard__body" onClick={() => onOpen(s.id)} tabIndex={-1} aria-hidden="true">
                <span className="src__table">
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
                </span>
              </button>
            )}
            {del && (
              <div className="scard__body scard__body--static">
                <span className="scard__warn">Документ удалён администратором 28.09.2026. Открыть его нельзя.</span>
                <span className="scard__ctx">Фрагмент на момент запроса:</span>
                <span className="scard__key">{s.frag}</span>
              </div>
            )}
            {s.note && <span className="scard__note">{s.note}</span>}
            {!del && (
              <button className="scard__open" onClick={() => onOpen(s.id)}>
                {pg ? `Открыть на стр. ${pg}` : 'Открыть документ'}
              </button>
            )}
          </article>
        );
      })}
    </section>
  );
}

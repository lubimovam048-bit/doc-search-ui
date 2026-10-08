import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { RESP_TABLE } from '../../data/sources';
import type { Source } from '../../data/types';

export const LIST_TAB = 'list';

interface Props {
  /** Источники ответа, которые можно открыть (без удалённых). */
  sources: Source[];
  /** Открытые вкладки документов, в порядке открытия. */
  tabs: string[];
  /** Активная вкладка: LIST_TAB или id документа. */
  active: string;
  onActivate: (id: string) => void;
  onOpen: (id: string) => void;
  onCloseTab: (id: string) => void;
}

const pageInfo = (s: Source) => /стр\.\s*(\d+)\s*из\s*(\d+)/.exec(s.meta);
const ext = (s: Source) => (s.kind === 'table' ? 'XLS' : 'PDF');
const shortTitle = (s: Source) => (s.title.length > 22 ? `${s.title.slice(0, 21)}…` : s.title);

/** Правая часть: вкладки «Список» и открытые документы. У каждой вкладки документа свой крестик. */
export default function DocPane({ sources, tabs, active, onActivate, onOpen, onCloseTab }: Props) {
  const [big, setBig] = useState(false);
  const current = sources.find((x) => x.id === active) ?? null;
  const pg = current ? pageInfo(current) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && current && onCloseTab(current.id);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, onCloseTab]);

  return (
    <aside className="docpane" aria-label="Документы ответа">
      <div className="dtabs" role="tablist">
        <button role="tab" aria-selected={active === LIST_TAB} className={`dtab dtab--list${active === LIST_TAB ? ' dtab--on' : ''}`} onClick={() => onActivate(LIST_TAB)}>
          <Icon name="list" size={16} />Список
        </button>
        {tabs.map((id) => {
          const s = sources.find((x) => x.id === id);
          if (!s) return null;
          return (
            <span key={id} className={`dtab${active === id ? ' dtab--on' : ''}`}>
              <button role="tab" aria-selected={active === id} className="dtab__main" onClick={() => onActivate(id)} title={s.title}>
                <span className="scard__ext">{ext(s)}</span>{shortTitle(s)}
              </button>
              <button className="dtab__x" onClick={() => onCloseTab(id)} aria-label={`Закрыть вкладку: ${s.title}`}><Icon name="x" size={14} /></button>
            </span>
          );
        })}
      </div>

      {active === LIST_TAB && (
        <div className="docpane__body">
          <h3 className="dlist__title">Документы ответа <span>{sources.length}</span></h3>
          <div className="dlist">
            {sources.map((s, i) => {
              const m = pageInfo(s);
              return (
                <button key={s.id} className="dlist__item" onClick={() => onOpen(s.id)}>
                  <span className="scard__ext">{ext(s)}</span>
                  <span className="dlist__text"><b>{s.title}</b><span>{m ? `стр. ${m[1]} из ${m[2]}` : s.meta}</span></span>
                  {tabs.includes(s.id) ? <span className="dlist__open">Открыт</span> : <span className="dlist__n">{i + 1}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {current && (
        <>
          <div className="docpane__head">
            <div className="docpane__titles">
              <b>{current.title}</b>
              <span>{current.meta}</span>
            </div>
            <div className="docpane__tools">
              <button onClick={() => setBig((v) => !v)} aria-pressed={big} aria-label="Увеличить текст" title="Увеличить текст"><Icon name="zoom" size={16} /></button>
            </div>
          </div>
          <div className="docpane__body">
            <div className={`docpage${big ? ' docpage--big' : ''}`}>
              <div className="docpage__top">
                <span className="docpage__no">{pg ? `СТР. ${pg[1]}` : ''}</span>
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
        </>
      )}
    </aside>
  );
}

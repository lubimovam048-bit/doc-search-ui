import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import type { Source } from '../../data/types';
import { DocActions, DocSheet, ext, pageInfo } from './DocView';

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
  /** Свернуть всю правую часть, вкладки сохраняются. */
  onHide: () => void;
  /** Закрыть все открытые документы. */
  onCloseAll: () => void;
  /** Адрес отдельной страницы документа (для новой вкладки и ссылок). */
  docUrl: (id: string) => string;
}

/** Правая часть: вкладки «Список» и открытые документы. У каждой вкладки документа свой крестик. */
export default function DocPane({ sources, tabs, active, onActivate, onOpen, onCloseTab, onHide, onCloseAll, docUrl }: Props) {
  const [big, setBig] = useState(false);
  const current = sources.find((x) => x.id === active) ?? null;

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
                <span className="scard__ext">{ext(s)}</span><span className="dtab__t">{s.title}</span>
              </button>
              <button className="dtab__x" onClick={() => onCloseTab(id)} aria-label={`Закрыть вкладку: ${s.title}`}><Icon name="x" size={14} /></button>
            </span>
          );
        })}
        <button className="dtabs__hide dtabs__hide--first" onClick={onCloseAll} aria-label="Закрыть все документы" title="Закрыть все документы">
          <Icon name="x" size={16} />Закрыть все
        </button>
        <button className="dtabs__hide dtabs__hide--second" onClick={onHide} aria-label="Свернуть документы" title="Свернуть">
          <Icon name="expand" size={16} />Свернуть
        </button>
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
          <DocActions source={current} docUrl={docUrl(current.id)} onOpenTab={() => window.open(docUrl(current.id), '_blank', 'noopener')} />
          <div className="docpane__body">
            <DocSheet source={current} big={big} />
          </div>
        </>
      )}
    </aside>
  );
}

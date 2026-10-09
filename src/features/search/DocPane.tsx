import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { useApp } from '../../context/AppContext';
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
  /** Свернуть всю правую часть, вкладки сохраняются. */
  onHide: () => void;
  /** Закрыть все открытые документы. */
  onCloseAll: () => void;
  /** Ссылка на ответ, в котором найден документ. */
  shareUrl: string;
}

const pageInfo = (s: Source) => /стр\.\s*(\d+)\s*из\s*(\d+)/.exec(s.meta);
const ext = (s: Source) => (s.kind === 'table' ? 'XLS' : 'PDF');

/** Правая часть: вкладки «Список» и открытые документы. У каждой вкладки документа свой крестик. */
export default function DocPane({ sources, tabs, active, onActivate, onOpen, onCloseTab, onHide, onCloseAll, shareUrl }: Props) {
  const { role } = useApp();
  const isAdmin = role === 'admin';
  const [big, setBig] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [note, setNote] = useState('');
  const sendRef = useRef<HTMLDivElement>(null);
  const current = sources.find((x) => x.id === active) ?? null;
  const pg = current ? pageInfo(current) : null;

  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(''), 2600);
    return () => window.clearTimeout(t);
  }, [note]);

  useEffect(() => {
    if (!sendOpen) return;
    const onDown = (e: MouseEvent) => sendRef.current && !sendRef.current.contains(e.target as Node) && setSendOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [sendOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && current && onCloseTab(current.id);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, onCloseTab]);

  const row = RESP_TABLE.rows.find((r) => r.hl);
  const fragment = current ? (current.kind === 'table' && row ? `${row.work}: ${row.who}, контроль ${row.control}, срок ${row.due}` : current.frag ?? '') : '';
  const cite = current ? `«${fragment}» (${current.title}${pg ? `, стр. ${pg[1]}` : ''})` : '';

  const copy = async (text: string, done: string) => {
    try { await navigator.clipboard.writeText(text); setNote(done); } catch { setNote('Не удалось скопировать'); }
    setSendOpen(false);
  };
  const download = () => {
    if (!current) return;
    // демо: оригинала файла нет, выгружаем найденный фрагмент с реквизитами документа
    const body = `${current.title}\n${current.meta}\n\nНайденный фрагмент:\n${fragment}\n\n(Демо-версия: скачивается фрагмент, а не оригинал документа.)\n`;
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${current.title}.txt`; a.click();
    URL.revokeObjectURL(url);
    setNote('Файл скачан (демо: выгружен найденный фрагмент)');
  };
  const mail = () => {
    if (!current) return;
    const subject = encodeURIComponent(current.title);
    const text = encodeURIComponent(`${cite}\n\nОтвет в системе: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${text}`;
    setSendOpen(false);
  };

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
          <div className="docpane__actions">
            {isAdmin && (
              <button className="dact" onClick={download}><Icon name="download" size={16} />Скачать</button>
            )}
            {isAdmin && (
              <div className="dact__wrap" ref={sendRef}>
                <button className="dact" onClick={() => setSendOpen((v) => !v)} aria-expanded={sendOpen} aria-haspopup="menu">
                  <Icon name="send" size={16} />Отправить<Icon name="chevDown" size={14} />
                </button>
                {sendOpen && (
                  <div className="menu dact__menu" role="menu">
                    <button role="menuitem" className="menu__item" onClick={() => copy(shareUrl, 'Ссылка скопирована')}><span className="hstack hstack--8"><Icon name="link" size={16} />Копировать ссылку</span></button>
                    <button role="menuitem" className="menu__item" onClick={mail}><span className="hstack hstack--8"><Icon name="mail" size={16} />Отправить письмом</span></button>
                  </div>
                )}
              </div>
            )}
            <button className="dact" onClick={() => copy(cite, 'Цитата скопирована')}><Icon name="copy" size={16} />Копировать цитату</button>
            {isAdmin && (
              <button className="dact dact--icon" onClick={() => window.print()} aria-label="Печать" title="Печать"><Icon name="print" size={16} /></button>
            )}
            {note && <span className="dact__note" role="status">{note}</span>}
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

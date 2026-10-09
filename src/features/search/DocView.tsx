import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { useApp } from '../../context/AppContext';
import { RESP_TABLE } from '../../data/sources';
import type { Source } from '../../data/types';

export const pageInfo = (s: Source) => /стр\.\s*(\d+)\s*из\s*(\d+)/.exec(s.meta);
export const ext = (s: Source) => (s.kind === 'table' ? 'XLS' : 'PDF');

/** Найденный фрагмент документа текстом. */
function fragmentOf(s: Source): string {
  const row = RESP_TABLE.rows.find((r) => r.hl);
  if (s.kind === 'table' && row) return `${row.work}: ${row.who}, контроль ${row.control}, срок ${row.due}`;
  return s.frag ?? '';
}

interface ActionsProps {
  source: Source;
  /** Адрес страницы документа: его копируем и вкладываем в письмо. */
  docUrl: string;
  /** Если задано, показываем кнопку «Открыть в новой вкладке». */
  onOpenTab?: () => void;
}

/** Действия над документом. Скачать, отправить и печать видит только администратор. */
export function DocActions({ source, docUrl, onOpenTab }: ActionsProps) {
  const { role } = useApp();
  const isAdmin = role === 'admin';
  const [sendOpen, setSendOpen] = useState(false);
  const [note, setNote] = useState('');
  const sendRef = useRef<HTMLDivElement>(null);
  const pg = pageInfo(source);
  const fragment = fragmentOf(source);
  const cite = `«${fragment}» (${source.title}${pg ? `, стр. ${pg[1]}` : ''})`;

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

  const copy = async (text: string, done: string) => {
    try { await navigator.clipboard.writeText(text); setNote(done); } catch { setNote('Не удалось скопировать'); }
    setSendOpen(false);
  };
  const download = () => {
    // демо: оригинала файла нет, выгружаем найденный фрагмент с реквизитами документа
    const body = `${source.title}\n${source.meta}\n\nНайденный фрагмент:\n${fragment}\n\n(Демо-версия: скачивается фрагмент, а не оригинал документа.)\n`;
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${source.title}.txt`; a.click();
    URL.revokeObjectURL(url);
    setNote('Файл скачан (демо: выгружен найденный фрагмент)');
  };
  const mail = () => {
    const subject = encodeURIComponent(source.title);
    const text = encodeURIComponent(`${cite}\n\nДокумент в системе: ${docUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${text}`;
    setSendOpen(false);
  };

  return (
    <div className="docpane__actions">
      {isAdmin && (
        <button className="dact" onClick={download}><Icon name="download" size={16} />Скачать</button>
      )}
      {onOpenTab && (
        <button className="dact" onClick={onOpenTab} title="Открыть документ в новой вкладке"><Icon name="external" size={16} />Перейти</button>
      )}
      <div className="dact__tools">
        {isAdmin && (
          <div className="dact__wrap" ref={sendRef}>
            <button className="dact dact--icon" onClick={() => setSendOpen((v) => !v)} aria-expanded={sendOpen} aria-haspopup="menu" aria-label="Отправить" title="Отправить">
              <Icon name="upload" size={16} />
            </button>
            {sendOpen && (
              <div className="menu dact__menu" role="menu">
                <button role="menuitem" className="menu__item" onClick={() => copy(docUrl, 'Ссылка скопирована')}><span className="hstack hstack--8"><Icon name="link" size={16} />Копировать ссылку</span></button>
                <button role="menuitem" className="menu__item" onClick={mail}><span className="hstack hstack--8"><Icon name="mail" size={16} />Отправить письмом</span></button>
              </div>
            )}
          </div>
        )}
        <button className="dact dact--icon" onClick={() => copy(cite, 'Цитата скопирована')} aria-label="Копировать цитату" title="Копировать цитату"><Icon name="copy" size={16} /></button>
        {isAdmin && (
          <button className="dact dact--icon" onClick={() => window.print()} aria-label="Печать" title="Печать"><Icon name="print" size={16} /></button>
        )}
      </div>
      {note && <span className="dact__note" role="status">{note}</span>}
    </div>
  );
}

/** Лист документа с подсвеченным фрагментом. */
export function DocSheet({ source, big }: { source: Source; big: boolean }) {
  const pg = pageInfo(source);
  return (
    <div className={`docpage${big ? ' docpage--big' : ''}`}>
      <div className="docpage__top">
        <span className="docpage__no">{pg ? `СТР. ${pg[1]}` : ''}</span>
        <span className="docpage__found">Найден 1 фрагмент</span>
      </div>
      {source.kind === 'text' && (
        <>
          <h3 className="docpage__title">{source.title.toUpperCase()}</h3>
          <p>{source.before}</p>
          <p><mark>{source.frag}</mark></p>
          <p>{source.after}</p>
          <span className="paper__line" /><span className="paper__line paper__line--s" /><span className="paper__line" />
        </>
      )}
      {source.kind === 'table' && (
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
  );
}

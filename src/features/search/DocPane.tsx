import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import Icon from '../../components/Icon';
import type { Source } from '../../data/types';
import { DocActions, DocSheet, ext, pageInfo } from './DocView';

export const LIST_TAB = 'list';

const MIN_W = 380;
const STORE = 'docpane-width';
const maxW = () => Math.min(960, Math.round(window.innerWidth * 0.7));
const clamp = (w: number) => Math.max(MIN_W, Math.min(maxW(), w));
const loadWidth = (): number | null => {
  try { const v = Number(localStorage.getItem(STORE)); return v ? clamp(v) : null; } catch { return null; }
};

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
  const [width, setWidth] = useState<number | null>(loadWidth);
  const [drag, setDrag] = useState(false);
  const paneRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // вертикальное колесо мыши листает вкладки вбок; трекпад и так умеет горизонтально
  const onStripWheel = (e: ReactWheelEvent) => {
    const el = stripRef.current;
    if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
  };

  // у краёв, где есть скрытые вкладки, лента плавно гаснет
  const [edges, setEdges] = useState({ l: false, r: false });
  const updateEdges = () => {
    const el = stripRef.current;
    if (!el) return;
    const l = el.scrollLeft > 2;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((e) => (e.l === l && e.r === r ? e : { l, r }));
  };

  // активная вкладка всегда целиком в зоне видимости
  useEffect(() => {
    stripRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    updateEdges();
  }, [active, tabs.length]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const current = sources.find((x) => x.id === active) ?? null;

  const startDrag = (e: ReactPointerEvent) => {
    e.preventDefault();
    const right = paneRef.current?.getBoundingClientRect().right ?? window.innerWidth;
    setDrag(true);
    document.body.classList.add('pane-dragging');
    let last = 0;
    const move = (ev: PointerEvent) => { last = clamp(right - ev.clientX); setWidth(last); };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.body.classList.remove('pane-dragging');
      setDrag(false);
      if (last) { try { localStorage.setItem(STORE, String(last)); } catch { /* без сохранения */ } }
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  const onGripKey = (e: ReactKeyEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const cur = paneRef.current?.getBoundingClientRect().width ?? 600;
    const next = clamp(cur + (e.key === 'ArrowLeft' ? 40 : -40));
    setWidth(next);
    try { localStorage.setItem(STORE, String(next)); } catch { /* без сохранения */ }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && current && onCloseTab(current.id);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, onCloseTab]);

  return (
    <aside
      ref={paneRef}
      className={`docpane${drag ? ' docpane--drag' : ''}`}
      style={width ? ({ '--pane-w': `${width}px` } as CSSProperties) : undefined}
      aria-label="Документы ответа"
    >
      <div
        className="docpane__grip"
        role="separator"
        aria-orientation="vertical"
        aria-label="Изменить ширину"
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={onGripKey}
        onDoubleClick={() => { setWidth(null); try { localStorage.removeItem(STORE); } catch { /* без сохранения */ } }}
        title="Потяните, чтобы изменить ширину. Двойной щелчок — вернуть как было"
      />
      <div className="dtabs">
        <div className={`dtabs__scroll${edges.l ? ' dtabs__scroll--l' : ''}${edges.r ? ' dtabs__scroll--r' : ''}`} role="tablist" ref={stripRef} onWheel={onStripWheel} onScroll={updateEdges}>
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
        </div>
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

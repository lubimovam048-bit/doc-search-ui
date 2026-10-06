import { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/Dialog';
import FilterRow, { type MenuDef } from '../components/FilterRow';
import Icon from '../components/Icon';
import SidePanel from '../components/SidePanel';
import {
  DOCUMENTS, DOC_FILTER_MENUS, DOC_STATUS, DOC_TYPES, NO_OBJECT, OBJECTS, suggestMeta, usedIn, type DocRow,
} from '../data/documents';

type Key = 'type' | 'status';
const MENUS = { type: DOC_FILTER_MENUS.type, status: DOC_FILTER_MENUS.status };
const INITIAL: Record<Key, string> = { type: 'Все типы', status: 'Все статусы' };
const PAGE = 8;
const ALL = 'all';
const TRASH = 'trash';

interface Pending { file: File; object: string; type: string }
interface Toast { text: string; undo?: () => void }

const today = () => new Date().toLocaleDateString('ru-RU');
const sizeText = (n: number) => `${(n / 1048576).toFixed(1).replace('.', ',')} МБ`;
const needsAttention = (d: DocRow) => !d.trashed && (d.status === 'error' || d.object === NO_OBJECT);

export default function FilesPage() {
  const [docs, setDocs] = useState<DocRow[]>(DOCUMENTS);
  const [node, setNode] = useState<string>(ALL);
  const [f, setF] = useState(INITIAL);
  const [q, setQ] = useState('');
  const [onlyAttn, setOnlyAttn] = useState(false);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<DocRow[] | null>(null);
  const [pending, setPending] = useState<Pending[] | null>(null);
  const [viewing, setViewing] = useState<DocRow | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [drag, setDrag] = useState(false);
  const pickRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceId = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => { setPage(0); setSel(new Set()); }, [node, f, q, onlyAttn]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const live = docs.filter((d) => !d.trashed);
  const attnCount = live.filter(needsAttention).length;
  const trashCount = docs.length - live.length;

  const rows = useMemo(
    () =>
      docs.filter((d) => {
        if (node === TRASH ? !d.trashed : d.trashed) return false;
        if (node !== ALL && node !== TRASH && d.object !== node) return false;
        if (f.type !== INITIAL.type && d.type !== f.type) return false;
        if (f.status !== INITIAL.status && DOC_STATUS[d.status].label !== f.status) return false;
        if (onlyAttn && !needsAttention(d)) return false;
        if (q.trim() && !d.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
      }),
    [docs, node, f, q, onlyAttn],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const visible = rows.slice(page * PAGE, page * PAGE + PAGE);
  const allOnPage = visible.length > 0 && visible.every((d) => sel.has(d.id));

  const menus: MenuDef<Key>[] = (Object.keys(MENUS) as Key[]).map((k) => ({ key: k, title: MENUS[k].title, options: MENUS[k].options, value: f[k] }));

  /* ---------- действия ---------- */
  const patch = (ids: string[], p: Partial<DocRow>) => setDocs((all) => all.map((d) => (ids.includes(d.id) ? { ...d, ...p } : d)));

  const finishLater = (id: string, ms = 2600) => {
    timers.current.push(window.setTimeout(() => patch([id], { status: 'ready', progress: undefined, note: '' }), ms));
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const ids = deleting.map((d) => d.id);
    patch(ids, { trashed: true });
    setSel(new Set());
    setDeleting(null);
    setToast({ text: ids.length === 1 ? 'Документ перемещён в корзину' : `Документов в корзине: ${ids.length}`, undo: () => patch(ids, { trashed: false }) });
  };

  const onFilesPicked = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setPending(list.map((file) => ({ file, ...suggestMeta(file.name) })));
  };

  const addPending = () => {
    if (!pending) return;
    const added: DocRow[] = pending.map((p, i) => ({
      id: `n${Date.now()}${i}`,
      title: p.file.name.replace(/\.[^.]+$/, ''),
      meta: `${(p.file.name.split('.').pop() || 'файл').toUpperCase()} · ${sizeText(p.file.size)}`,
      object: p.object, type: p.type, date: today(), by: 'Вы', status: 'processing', progress: 40, note: 'Распознавание', action: 'Открыть',
    }));
    setDocs((all) => [...added, ...all]);
    added.forEach((d, i) => finishLater(d.id, 2200 + i * 500));
    setNode(ALL); setPending(null);
    setToast({ text: `Добавлено документов: ${added.length}. Идёт обработка` });
  };

  const onReplacePicked = (files: FileList | null) => {
    const id = replaceId.current; const file = files?.[0];
    if (!id || !file) return;
    patch([id], { status: 'processing', progress: 30, note: 'Загружена новая версия', date: today(), by: 'Вы', meta: `${(file.name.split('.').pop() || '').toUpperCase()} · ${sizeText(file.size)}` });
    finishLater(id);
    setToast({ text: 'Версия заменена. Предыдущая сохранена в истории документа' });
  };

  const startReplace = (id: string) => { replaceId.current = id; replaceRef.current?.click(); };
  const toggleAll = () => setSel((s) => { const n = new Set(s); visible.forEach((d) => (allOnPage ? n.delete(d.id) : n.add(d.id))); return n; });
  const toggleOne = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selected = docs.filter((d) => sel.has(d.id));

  const nodes: { id: string; label: string; count: number; warn?: boolean }[] = [
    { id: ALL, label: 'Все документы', count: live.length },
    ...OBJECTS.map((o) => ({ id: o, label: o, count: live.filter((d) => d.object === o).length })),
    { id: NO_OBJECT, label: NO_OBJECT, count: live.filter((d) => d.object === NO_OBJECT).length, warn: true },
    { id: TRASH, label: 'Корзина', count: trashCount },
  ];

  return (
    <main
      className="main main--wide"
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFilesPicked(e.dataTransfer.files); }}
    >
      <div className="page-head">
        <h1 className="t-h3">Файлы</h1>
        <button className="btn-p t-btn2 hstack hstack--8" style={{ flexWrap: 'nowrap' }} onClick={() => pickRef.current?.click()}>
          <Icon name="upload" size={18} />Загрузить файлы
        </button>
        <input ref={pickRef} type="file" multiple hidden aria-label="Выбрать файлы" onChange={(e) => { onFilesPicked(e.target.files ?? []); e.target.value = ''; }} />
        <input ref={replaceRef} type="file" hidden aria-label="Выбрать новую версию" onChange={(e) => { onReplacePicked(e.target.files); e.target.value = ''; }} />
      </div>

      {drag && <div className="dropzone" role="status">Отпустите файлы, чтобы добавить</div>}

      <div className="hstack hstack--12">
        <label className="search-box" style={{ flex: '0 1 360px' }}>
          <Icon name="search" size={16} color="var(--er-color-subtle)" />
          <input className="t-b25" aria-label="Поиск по названию" placeholder="Название или номер приказа" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <FilterRow menus={menus} onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))} />
      </div>

      {attnCount > 0 && node !== TRASH && (
        <div className="notice notice--sm" style={{ marginBottom: 0, alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="hstack hstack--12" style={{ flexWrap: 'nowrap' }}>
            <Icon name="warn" color="var(--er-color-warning)" />
            <span className="t-b25"><b>Требуют внимания: {attnCount}.</b> Ошибки чтения или не указан объект.</span>
          </span>
          <button className="ghost t-btn2" aria-pressed={onlyAttn} onClick={() => setOnlyAttn((v) => !v)}>{onlyAttn ? 'Показать все' : 'Показать'}</button>
        </div>
      )}

      <div className="files">
        <nav className="tree" aria-label="Объекты">
          {nodes.map((n) => (
            <button key={n.id} className={`tree__item${node === n.id ? ' tree__item--on' : ''}`} onClick={() => setNode(n.id)} aria-current={node === n.id ? 'true' : undefined}>
              <Icon name={n.id === TRASH ? 'trash' : n.id === ALL ? 'layers' : 'folder'} size={16} />
              <span className="tree__label">{n.label}</span>
              <span className={`tree__count${n.warn && n.count ? ' tree__count--warn' : ''}`}>{n.count}</span>
            </button>
          ))}
        </nav>

        <div className="card1 files__table">
          {sel.size > 0 && (
            <div className="bulk" role="region" aria-label="Действия с выбранными">
              <span className="t-btn2">Выбрано: {sel.size}</span>
              <div className="hstack hstack--8">
                {node === TRASH ? (
                  <button className="ghost t-btn2" onClick={() => { patch([...sel], { trashed: false }); setSel(new Set()); }}>Восстановить</button>
                ) : (
                  <>
                    <select className="select t-b25" aria-label="Сменить объект" value="" onChange={(e) => { if (e.target.value) { patch([...sel], { object: e.target.value }); setSel(new Set()); } }}>
                      <option value="">Сменить объект…</option>
                      {OBJECTS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <button className="btn-danger t-btn2" onClick={() => setDeleting(selected)}>Удалить</button>
                  </>
                )}
                <button className="btn-text t-btn2" onClick={() => setSel(new Set())}>Снять выбор</button>
              </div>
            </div>
          )}
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}><input type="checkbox" className="check" aria-label="Выбрать все на странице" checked={allOnPage} onChange={toggleAll} /></th>
                  <th>Название</th><th>Объект · тип</th><th>Загружен</th><th>Статус</th><th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((d) => {
                  const st = DOC_STATUS[d.status];
                  const busy = d.status === 'processing' || d.status === 'queued';
                  return (
                    <tr key={d.id} className={sel.has(d.id) ? 'tr--sel' : ''}>
                      <td><input type="checkbox" className="check" aria-label={`Выбрать «${d.title}»`} checked={sel.has(d.id)} onChange={() => toggleOne(d.id)} /></td>
                      <td style={{ minWidth: 240 }}>
                        <div className="cell-stack"><span className="t-b2" style={{ fontWeight: 500 }}>{d.title}</span><span className="t-b3 c3">{d.meta}</span></div>
                      </td>
                      <td><div className="cell-stack"><span className={`t-b25${d.object === NO_OBJECT ? ' c-orange' : ''}`}>{d.object}</span><span className="t-b3 c3">{d.type}</span></div></td>
                      <td style={{ whiteSpace: 'nowrap' }}><div className="cell-stack"><span className="t-b25">{d.date}</span><span className="t-b3 c3">{d.by}</span></div></td>
                      <td style={{ minWidth: 170 }}>
                        <div className="stack stack--8" style={{ alignItems: 'flex-start' }}>
                          <span className="status" style={{ color: st.color }}><span className="dot" style={{ background: st.color }} />{st.label}</span>
                          {d.progress !== undefined && <div className="progress progress--sm"><div className="progress__bar" style={{ width: `${d.progress}%` }} /></div>}
                          {d.note && <span className="t-b3 c3">{d.note}</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions">
                          {d.trashed ? (
                            <button className="btn-link t-b25" onClick={() => patch([d.id], { trashed: false })}>Восстановить</button>
                          ) : (
                            <>
                              {!busy && d.status !== 'error' && <button className="btn-link t-b25" onClick={() => setViewing(d)}>Открыть</button>}
                              {!busy && <button className="btn-link t-b25" onClick={() => startReplace(d.id)}>Заменить</button>}
                              <button className="btn-link btn-link--danger t-b25" onClick={() => setDeleting([d])}>Удалить</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="empty-state">
                <span className="t-sub3">{node === TRASH ? 'Корзина пуста' : 'Ничего не найдено'}</span>
                <span className="t-b25 c3">{node === TRASH ? 'Удалённые файлы хранятся здесь 30 дней.' : 'Измените фильтры или строку поиска.'}</span>
              </div>
            )}
          </div>
          {rows.length > PAGE && (
            <div className="pager">
              <span className="t-b25 c3">{page * PAGE + 1}–{Math.min(rows.length, page * PAGE + PAGE)} из {rows.length}</span>
              <div className="hstack hstack--8">
                <button className="ghost t-btn2" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Назад</button>
                <button className="ghost t-btn2" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Далее</button>
              </div>
            </div>
          )}
          {node === TRASH && rows.length > 0 && <div className="pager"><span className="t-b3 c3">Файлы из корзины удаляются навсегда через 30 дней.</span></div>}
        </div>
      </div>

      {/* загрузка: проверка предложенных значений */}
      {pending && (
        <Dialog
          wide
          title={`Добавить файлов: ${pending.length}`}
          onClose={() => setPending(null)}
          actions={
            <>
              <button className="ghost t-btn2" onClick={() => setPending(null)}>Отмена</button>
              <button className="btn-p t-btn2" disabled={pending.some((p) => !p.object || !p.type)} onClick={addPending}>Добавить</button>
            </>
          }
        >
          <span className="t-b25 c3">Система предложила объект и тип по названию. Проверьте и при необходимости исправьте.</span>
          <div className="review">
            {pending.map((p, i) => (
              <div key={i} className="review__row">
                <span className="t-b25 review__name" title={p.file.name}>{p.file.name}</span>
                <select className="select t-b25" aria-label={`Объект: ${p.file.name}`} value={p.object} onChange={(e) => setPending((all) => all!.map((x, j) => (j === i ? { ...x, object: e.target.value } : x)))}>
                  <option value="">Выберите объект</option>
                  {OBJECTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="select t-b25" aria-label={`Тип: ${p.file.name}`} value={p.type} onChange={(e) => setPending((all) => all!.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                  <option value="">Выберите тип</option>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Dialog>
      )}

      {/* удаление с последствиями */}
      {deleting && (() => {
        const used = deleting.reduce((n, d) => n + usedIn(d.id), 0);
        return (
          <Dialog
            title={deleting.length === 1 ? `Удалить документ «${deleting[0].title}»?` : `Удалить документов: ${deleting.length}?`}
            onClose={() => setDeleting(null)}
            actions={
              <>
                <button className="ghost t-btn2" onClick={() => setDeleting(null)}>Отмена</button>
                <button className="btn-danger t-btn2" onClick={confirmDelete}>Удалить</button>
              </>
            }
          >
            <span className="t-b2 c3">
              {used > 0 ? `Использовано в ответах: ${used}. ` : 'В ответах не использовался. '}
              В журнале и истории останется статус «источник удалён». Файлы 30 дней лежат в корзине, их можно вернуть.
            </span>
          </Dialog>
        );
      })()}

      {viewing && (
        <SidePanel
          wide
          title={viewing.title}
          subtitle={`${viewing.object} · ${viewing.type} · ${viewing.meta}`}
          onClose={() => setViewing(null)}
          footer={<button className="ghost t-btn2" onClick={() => { startReplace(viewing.id); setViewing(null); }}>Заменить версию</button>}
        >
          <div className="paper">
            <span className="paper__line" /><span className="paper__line paper__line--s" /><span className="paper__line" />
            <span className="paper__line" /><span className="paper__line paper__line--s" /><span className="paper__line" />
            <span className="paper__line paper__line--s" /><span className="paper__line" />
            <span className="t-cap1 c3">Макет просмотра: здесь откроется оригинал документа.</span>
          </div>
        </SidePanel>
      )}

      {toast && (
        <div className="toast" role="status">
          <span className="t-b25">{toast.text}</span>
          {toast.undo && <button className="btn-link t-btn2 toast__undo" onClick={() => { toast.undo?.(); setToast(null); }}>Вернуть</button>}
        </div>
      )}
    </main>
  );
}

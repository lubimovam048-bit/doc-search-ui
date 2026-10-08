import { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/Dialog';
import Icon from '../components/Icon';
import SidePanel from '../components/SidePanel';
import {
  DOCUMENTS, DOC_STATUS, DOC_TYPES, OBJECTS, suggestMeta, usedIn, type DocRow,
} from '../data/documents';

type Tab = 'all' | 'ok' | 'no';
const PAGE = 8;
const ALL = 'all';
const TRASH = 'trash';

interface Pending { file: File; object: string; type: string }
interface Toast { text: string; undo?: () => void }

const today = () => new Date().toLocaleDateString('ru-RU');
const sizeText = (n: number) => `${(n / 1048576).toFixed(1).replace('.', ',')} МБ`;
const ext = (d: DocRow) => (d.meta.split(' · ')[0] || 'ФАЙЛ').slice(0, 4);
const sizeOf = (d: DocRow) => d.meta.split(' · ').slice(-1)[0];
const needsAttention = (d: DocRow) => !d.trashed && d.status === 'error';

export default function FilesPage() {
  const [docs, setDocs] = useState<DocRow[]>(DOCUMENTS);
  const [node, setNode] = useState<string>(ALL);
  const [tab, setTab] = useState<Tab>('all');
  const [focus, setFocus] = useState<string | null>(null);
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
  useEffect(() => { setPage(0); setSel(new Set()); }, [node, tab, q, onlyAttn]);
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
        if (tab === 'ok' && d.status !== 'ready') return false;
        if (tab === 'no' && d.status === 'ready') return false;
        if (onlyAttn && !needsAttention(d)) return false;
        if (q.trim() && !d.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
      }),
    [docs, node, tab, q, onlyAttn],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const visible = rows.slice(page * PAGE, page * PAGE + PAGE);
  const allOnPage = visible.length > 0 && visible.every((d) => sel.has(d.id));

  const inNode = live.filter((d) => node === ALL || d.object === node);
  const okCount = inNode.filter((d) => d.status === 'ready').length;
  const detail = docs.find((d) => d.id === focus && !!d.trashed === (node === TRASH)) ?? null;

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
    { id: TRASH, label: 'Корзина', count: trashCount },
  ];

  const crumb = node === ALL ? 'Все документы' : node === TRASH ? 'Корзина' : node;

  return (
    <main
      className="fm"
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFilesPicked(e.dataTransfer.files); }}
    >
      <div className="fm__bar">
        <div className="fm__crumbs" aria-label="Путь">
          <button onClick={() => setNode(ALL)}>Документы</button>
          <Icon name="arrow" size={14} color="var(--er-color-subtle)" />
          <b>{crumb}</b>
        </div>
        <label className="fm__search">
          <Icon name="search" size={16} color="var(--er-color-subtle)" />
          <input aria-label="Поиск по названию" placeholder="Поиск по документам" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <button className="btn-p t-btn2 hstack hstack--8" style={{ flexWrap: 'nowrap' }} onClick={() => pickRef.current?.click()}>
          <Icon name="upload" size={18} />Загрузить
        </button>
        <input ref={pickRef} type="file" multiple hidden aria-label="Выбрать файлы" onChange={(e) => { onFilesPicked(e.target.files ?? []); e.target.value = ''; }} />
        <input ref={replaceRef} type="file" hidden aria-label="Выбрать новую версию" onChange={(e) => { onReplacePicked(e.target.files); e.target.value = ''; }} />
      </div>

      <div className="fm__tabs" role="tablist" aria-label="Статус обработки">
        {([['all', 'Все', inNode.length], ['ok', 'Обработаны', okCount], ['no', 'Не обработаны', inNode.length - okCount]] as const).map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`fm__tab${tab === k ? ' fm__tab--on' : ''}`} onClick={() => setTab(k)}>
            {label}<i>{n}</i>
          </button>
        ))}
      </div>

      {drag && <div className="dropzone" role="status">Отпустите файлы, чтобы добавить</div>}

      <div className="fm__body">
        <nav className="fm__tree" aria-label="Объекты">
          {nodes.map((n) => (
            <button key={n.id} className={`fm__node${node === n.id ? ' fm__node--on' : ''}${n.id === TRASH ? ' fm__node--trash' : ''}`} onClick={() => { setNode(n.id); setFocus(null); }} aria-current={node === n.id ? 'true' : undefined}>
              <Icon name={n.id === TRASH ? 'trash' : 'folder'} size={16} />
              <span className="fm__label">{n.label}</span>
              <span className="fm__count">{n.count}</span>
            </button>
          ))}
        </nav>

        <section className="fm__list" aria-label="Документы">
          {attnCount > 0 && node !== TRASH && (
            <div className="fm__attn">
              <Icon name="warn" size={16} color="var(--er-color-warning)" />
              <span className="t-b25"><b>Требуют внимания: {attnCount}.</b> Не удалось прочитать файлы.</span>
              <button className="btn-link t-b25" aria-pressed={onlyAttn} onClick={() => setOnlyAttn((v) => !v)}>{onlyAttn ? 'Показать все' : 'Показать'}</button>
            </div>
          )}
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

          <div className="fm__row fm__row--head">
            <input type="checkbox" className="check" aria-label="Выбрать все на странице" checked={allOnPage} onChange={toggleAll} />
            <span>Название</span><span>Статус</span><span>Изменён</span><span>Размер</span>
          </div>
          <div className="fm__rows">
            {visible.map((d) => {
              const st = DOC_STATUS[d.status];
              return (
                <div key={d.id} className={`fm__row${sel.has(d.id) || focus === d.id ? ' fm__row--sel' : ''}`} onClick={() => setFocus(d.id)}>
                  <input type="checkbox" className="check" aria-label={`Выбрать «${d.title}»`} checked={sel.has(d.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleOne(d.id)} />
                  <span className="fm__name">
                    <span className="fm__ext">{ext(d)}</span>
                    <button className="fm__title" onClick={(e) => { e.stopPropagation(); setFocus(d.id); }} title={d.title}>{d.title}</button>
                  </span>
                  <span className="fm__status">
                    <span className="dot" style={{ background: st.color }} />{st.label}
                    {d.progress !== undefined && <span className="fm__mini"><i style={{ width: `${d.progress}%` }} /></span>}
                  </span>
                  <span>{d.date}</span>
                  <span>{sizeOf(d)}</span>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div className="empty-state">
                <span className="t-sub3">{node === TRASH ? 'Корзина пуста' : 'Ничего не найдено'}</span>
                <span className="t-b25 c3">{node === TRASH ? 'Удалённые файлы хранятся здесь 30 дней.' : 'Измените фильтр или строку поиска.'}</span>
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
          {node !== TRASH && (
            <button className="fm__drop" onClick={() => pickRef.current?.click()}>
              <Icon name="upload" size={16} />Перетащите файлы сюда или нажмите, чтобы загрузить
            </button>
          )}
        </section>

        <aside className="fm__detail" aria-label="Сведения о документе">
          {detail ? (
            <>
              <div className="fm__preview" aria-hidden="true">
                <span className="paper__line" /><span className="paper__line paper__line--s" /><span className="paper__line" />
                <span className="paper__line" /><span className="paper__line paper__line--s" />
              </div>
              <h2 className="fm__dtitle">{detail.title}</h2>
              <dl className="fm__facts">
                <dt>Тип</dt><dd>{detail.meta.split(' · ').slice(0, -1).join(' · ') || detail.type}</dd>
                <dt>Размер</dt><dd>{sizeOf(detail)}</dd>
                <dt>Загружен</dt><dd>{detail.date}, {detail.by}</dd>
                <dt>Объект</dt><dd>{detail.object}</dd>
                <dt>Статус</dt><dd><span className="dot" style={{ background: DOC_STATUS[detail.status].color }} />{detail.note || DOC_STATUS[detail.status].label}</dd>
              </dl>
              {detail.trashed ? (
                <button className="btn-p t-btn2" onClick={() => patch([detail.id], { trashed: false })}>Восстановить</button>
              ) : (
                <>
                  {detail.status !== 'processing' && detail.status !== 'queued' && detail.status !== 'error' && (
                    <button className="btn-p t-btn2" onClick={() => setViewing(detail)}>Открыть документ</button>
                  )}
                  <div className="fm__actions">
                    {detail.status !== 'processing' && detail.status !== 'queued' && (
                      <button className="ghost t-btn2 fm__grow" onClick={() => startReplace(detail.id)}>Заменить версию</button>
                    )}
                    <button className="ghost t-btn2 fm__del" aria-label="Удалить" onClick={() => setDeleting([detail])}><Icon name="trash" size={16} /></button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="fm__hint t-b25 c3">Выберите документ, чтобы увидеть сведения.</p>
          )}
        </aside>
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
              <button className="btn-p t-btn2" onClick={addPending}>Добавить</button>
            </>
          }
        >
          <span className="t-b25 c3">Система предложила объект и тип по названию. Привязывать документ к объекту необязательно: выберите «Без привязки к объекту».</span>
          <div className="review">
            {pending.map((p, i) => (
              <div key={i} className="review__row">
                <span className="t-b25 review__name" title={p.file.name}>{p.file.name}</span>
                <select className="select t-b25" aria-label={`Объект: ${p.file.name}`} value={p.object} onChange={(e) => setPending((all) => all!.map((x, j) => (j === i ? { ...x, object: e.target.value } : x)))}>
                  {OBJECTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="select t-b25" aria-label={`Тип: ${p.file.name}`} value={p.type} onChange={(e) => setPending((all) => all!.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
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

import { useMemo, useState } from 'react';
import FilterRow, { type MenuDef } from '../components/FilterRow';
import Icon from '../components/Icon';
import { DOCUMENTS, DOC_FILTER_MENUS, DOC_STATUS } from '../data/documents';

type Key = keyof typeof DOC_FILTER_MENUS;

const INITIAL: Record<Key, string> = {
  object: 'Все объекты', type: 'Все типы', period: 'Весь период', status: 'Все статусы',
};

export default function DocumentsPage() {
  const [f, setF] = useState(INITIAL);
  const [q, setQ] = useState('');
  const [drag, setDrag] = useState(false);

  const menus: MenuDef<Key>[] = (Object.keys(DOC_FILTER_MENUS) as Key[]).map((k) => ({
    key: k, title: DOC_FILTER_MENUS[k].title, options: DOC_FILTER_MENUS[k].options, value: f[k],
  }));

  const rows = useMemo(
    () =>
      DOCUMENTS.filter((d) => {
        if (f.object !== INITIAL.object && d.object !== f.object) return false;
        if (f.type !== INITIAL.type && d.type !== f.type) return false;
        if (f.status !== INITIAL.status && DOC_STATUS[d.status].label !== f.status) return false;
        if (q.trim() && !d.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
      }),
    [f, q],
  );

  return (
    <main className="main main--wide">
      <div className="page-head">
        <div className="stack stack--8">
          <h1 className="t-h3 c1" style={{ margin: 0 }}>Документы</h1>
          <span className="t-b25 c3">Загрузка и удаление доступны только администраторам.</span>
        </div>
        <button className="btn-p t-btn2">Загрузить документы</button>
      </div>

      <div
        className={`card1 upload${drag ? ' upload--drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); }}
      >
        <div className="stack stack--8">
          <span className="t-sub3 c1">Перетащите файлы сюда</span>
          <span className="t-cap1 c3">PDF, DOCX, XLSX, сканы. Распознавание текста запускается автоматически.</span>
        </div>
        <div className="upload__progress">
          <span className="t-b25 c2">Загружается 2 файла · <span className="c1">64 %</span></span>
          <div className="progress" role="progressbar" aria-valuenow={64} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress__bar" style={{ width: '64%' }} />
          </div>
        </div>
      </div>

      <div className="card2 notice notice--sm" style={{ borderColor: 'rgba(255,138,0,.35)', marginBottom: 0 }}>
        <Icon name="info" color="var(--orange)" />
        <span className="t-b25 c2">
          Удалённые документы остаются в журнале запросов и истории пользователей со статусом «источник удалён». Ответы при этом не меняются.
        </span>
      </div>

      <FilterRow
        menus={menus}
        onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))}
        alignRight
        extra={
          <label className="search-box">
            <Icon name="search" size={16} color="var(--text-3)" />
            <input className="t-b25" aria-label="Поиск по названию" placeholder="Название или номер приказа" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        }
      />

      <div className="card1 table-wrap">
        <table className="table" style={{ minWidth: 880 }}>
          <thead>
            <tr>
              <th>Название</th><th>Объект · тип</th><th>Загружен</th><th>Статус</th>
              <th style={{ textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const st = DOC_STATUS[d.status];
              return (
                <tr key={d.id}>
                  <td style={{ minWidth: 260 }}>
                    <div className="cell-stack"><span className="t-b2 c1">{d.title}</span><span className="t-b3 c3">{d.meta}</span></div>
                  </td>
                  <td><div className="cell-stack"><span className="t-b25 c2">{d.object}</span><span className="t-b3 c3">{d.type}</span></div></td>
                  <td><div className="cell-stack"><span className="t-b25 c2">{d.date}</span><span className="t-b3 c3">{d.by}</span></div></td>
                  <td style={{ minWidth: 190 }}>
                    <div className="stack stack--8" style={{ alignItems: 'flex-start' }}>
                      <span className="status" style={{ color: st.color }}><span className="dot" style={{ background: st.color }} />{st.label}</span>
                      {d.progress !== undefined && (
                        <div className="progress progress--sm"><div className="progress__bar" style={{ width: `${d.progress}%` }} /></div>
                      )}
                      {d.note && <span className="t-b3 c3">{d.note}</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="hstack hstack--8" style={{ display: 'inline-flex' }}>
                      <button className="ghost t-btn2">{d.action}</button>
                      <button className="btn-danger t-btn2">Удалить</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty-state">
            <span className="t-sub3 c1">Ничего не найдено</span>
            <span className="t-b25 c3">Измените фильтры или строку поиска.</span>
          </div>
        )}
      </div>
    </main>
  );
}

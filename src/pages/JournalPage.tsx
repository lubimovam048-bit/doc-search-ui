import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidePanel from '../components/SidePanel';
import FilterRow, { type MenuDef } from '../components/FilterRow';
import { GAPS, JOURNAL_FILTERS, LOG, TILES, type LogRow } from '../data/journal';

type Key = keyof typeof JOURNAL_FILTERS;

const INITIAL: Record<Key, string> = {
  period: 'Период: 30 дней', user: 'Все пользователи', type: 'Все типы ответа', scope: 'Все области',
};
const TONE: Record<LogRow['tone'], string> = { ok: 'var(--er-color-success)', warn: 'var(--er-color-warning)', bad: 'var(--er-color-danger)' };

export default function JournalPage() {
  const navigate = useNavigate();
  const [f, setF] = useState(INITIAL);
  const [onlySrc, setOnlySrc] = useState(false);
  const [open, setOpen] = useState<LogRow | null>(null);
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [onlyDiv, setOnlyDiv] = useState(false);

  const menus: MenuDef<Key>[] = (Object.keys(JOURNAL_FILTERS) as Key[]).map((k) => ({
    key: k,
    title: JOURNAL_FILTERS[k].title,
    options: JOURNAL_FILTERS[k].options,
    value: f[k],
    label: (v, active) => (k === 'period' ? v : active ? `${JOURNAL_FILTERS[k].title}: ${v}` : JOURNAL_FILTERS[k].title),
  }));

  const rows = useMemo(
    () =>
      LOG.filter((r) => {
        if (onlyEmpty && !r.empty) return false;
        if (onlyDiv && !r.divergence) return false;
        if (onlySrc && r.rating !== 'Источник не тот') return false;
        if (f.user !== INITIAL.user && r.user !== f.user) return false;
        if (f.type !== INITIAL.type && r.result !== f.type) return false;
        return true;
      }),
    [f, onlyEmpty, onlyDiv, onlySrc],
  );

  return (
    <main className="main main--wide">
      <div className="page-head">
        <div className="stack stack--8">
          <h1 className="t-h3 c1" style={{ margin: 0 }}>Журнал запросов</h1>
          <span className="t-b25 c3">Нажмите на цифру, чтобы отфильтровать. Нажмите на строку, чтобы увидеть ответ.</span>
        </div>
        <button className="ghost t-btn2">Выгрузить журнал</button>
      </div>

      <div className="tiles">
        {TILES.map((t, i) => {
          const on = i === 1 ? onlyEmpty : i === 2 ? onlyDiv : i === 3 ? onlySrc : !onlyEmpty && !onlyDiv && !onlySrc;
          const apply = () => {
            setOnlyEmpty(i === 1 ? !onlyEmpty : false);
            setOnlyDiv(i === 2 ? !onlyDiv : false);
            setOnlySrc(i === 3 ? !onlySrc : false);
          };
          return (
            <button key={t.label} className={`card1 tile tile--btn rise${i < 2 ? ' tile--blue' : ''}${on && i > 0 ? ' tile--on' : ''}`} aria-pressed={i > 0 ? on : undefined} onClick={apply}>
              <span className="t-b25 c3">{t.label}</span>
              <span className="t-h1" style={i < 2 ? undefined : { color: t.color }}>{t.value}</span>
              <span className="t-cap1 c3">{t.note}</span>
            </button>
          );
        })}
      </div>

      <FilterRow
        menus={menus}
        onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))}
        extra={null}
      />

      <div className="card1 table-wrap">
        <table className="table" style={{ minWidth: 900 }}>
          <thead>
            <tr><th>Время</th><th>Пользователь</th><th>Запрос</th><th>Результат</th><th>Источники</th><th>Оценка</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="tr--click" tabIndex={0} onClick={() => setOpen(r)} onKeyDown={(e) => e.key === 'Enter' && setOpen(r)}>
                <td className="t-b25 c3" style={{ whiteSpace: 'nowrap' }}>{r.time}</td>
                <td className="t-b25 c2" style={{ whiteSpace: 'nowrap' }}>{r.user}</td>
                <td className="t-b2 c1" style={{ minWidth: 280 }}>{r.query}</td>
                <td><span className="status" style={{ color: TONE[r.tone], whiteSpace: 'nowrap' }}><span className="dot" style={{ background: TONE[r.tone] }} />{r.result}</span></td>
                <td>
                  <div className="cell-stack">
                    <span className="t-b25 c2">{r.sources}</span>
                    <span className="t-b3" style={{ color: r.sourceNoteTone === 'bad' ? 'var(--er-color-danger)' : 'var(--er-color-muted)' }}>{r.sourceNote}</span>
                  </div>
                </td>
                <td className="t-b25 c3">{r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty-state"><span className="t-sub3 c1">Нет запросов по выбранным условиям</span></div>
        )}
      </div>

      {open && (
        <SidePanel
          title={open.query}
          subtitle={`${open.user} · ${open.time}`}
          onClose={() => setOpen(null)}
          footer={open.empty ? <button className="btn-p t-btn2" onClick={() => navigate('/files')}>Загрузить недостающий документ</button> : undefined}
        >
          <div className="stack stack--16">
            <div className="hstack hstack--12">
              <span className="status" style={{ color: TONE[open.tone] }}><span className="dot" style={{ background: TONE[open.tone] }} />{open.result}</span>
              <span className="t-b25 c3">Оценка: {open.rating}</span>
            </div>
            <div className="stack stack--8">
              <span className="t-b3 c3">Ответ пользователю</span>
              <span className="t-blog">{open.answer}</span>
            </div>
            <div className="stack stack--8">
              <span className="t-b3 c3">Источники</span>
              {open.docs.length === 0 ? <span className="t-b25 c3">Источников нет</span> : open.docs.map((d, i) => (
                <span key={d} className="hstack hstack--8 t-b25" style={{ flexWrap: 'nowrap' }}><span className="cn">{i + 1}</span>{d}</span>
              ))}
            </div>
            <span className="t-b25 c3">{open.sourceNote}</span>
          </div>
        </SidePanel>
      )}

      <div className="card1 stack stack--8" style={{ padding: 28 }}>
        <div className="hstack hstack--12" style={{ justifyContent: 'space-between', paddingBottom: 12 }}>
          <span className="t-sub2 c1">Вопросы без ответа: каких документов не хватает</span>
          <span className="t-b25 tag-idea">Идея для руководства, не MVP</span>
        </div>
        {GAPS.map((g) => (
          <div key={g.q} className="gap-row">
            <div className="stack" style={{ gap: 6, minWidth: 0, flex: '1 1 320px' }}>
              <span className="t-b2 c1">{g.q}</span>
              <span className="t-b3 c3">{g.note}</span>
            </div>
            <span className="t-sub2 c2" style={{ whiteSpace: 'nowrap' }}>{g.count}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

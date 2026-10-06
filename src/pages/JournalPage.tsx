import { useMemo, useState } from 'react';
import FilterRow, { type MenuDef } from '../components/FilterRow';
import { GAPS, JOURNAL_FILTERS, LOG, TILES, type LogRow } from '../data/journal';

type Key = keyof typeof JOURNAL_FILTERS;

const INITIAL: Record<Key, string> = {
  period: 'Период: 30 дней', user: 'Все пользователи', type: 'Все типы ответа', scope: 'Все области',
};
const TONE: Record<LogRow['tone'], string> = { ok: 'var(--green)', warn: 'var(--orange)', bad: 'var(--red)' };

export default function JournalPage() {
  const [f, setF] = useState(INITIAL);
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
        if (f.user !== INITIAL.user && r.user !== f.user) return false;
        if (f.type !== INITIAL.type && r.result !== f.type) return false;
        return true;
      }),
    [f, onlyEmpty, onlyDiv],
  );

  return (
    <main className="main main--wide">
      <div className="page-head">
        <div className="stack stack--8">
          <h1 className="t-h3 c1" style={{ margin: 0 }}>Журнал запросов</h1>
          <span className="t-b25 c3">Администратор видит все запросы. Пользователь видит только свои.</span>
        </div>
        <button className="ghost t-btn2">Выгрузить журнал</button>
      </div>

      <div className="tiles">
        {TILES.map((t) => (
          <div key={t.label} className="card1 tile rise">
            <span className="t-b25 c3">{t.label}</span>
            <span className="t-h1" style={{ color: t.color }}>{t.value}</span>
            <span className="t-cap1 c3">{t.note}</span>
          </div>
        ))}
      </div>

      <FilterRow
        menus={menus}
        onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))}
        extra={null}
      />
      <div className="hstack hstack--8" style={{ marginTop: -12 }}>
        <button className={`pill${onlyEmpty ? ' pill--active' : ''}`} aria-pressed={onlyEmpty} onClick={() => setOnlyEmpty((v) => !v)}>Только без ответа</button>
        <button className={`pill${onlyDiv ? ' pill--active' : ''}`} aria-pressed={onlyDiv} onClick={() => setOnlyDiv((v) => !v)}>Только с расхождением</button>
      </div>

      <div className="card1 table-wrap">
        <table className="table" style={{ minWidth: 900 }}>
          <thead>
            <tr><th>Время</th><th>Пользователь</th><th>Запрос</th><th>Результат</th><th>Источники</th><th>Оценка</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="t-b25 c3" style={{ whiteSpace: 'nowrap' }}>{r.time}</td>
                <td className="t-b25 c2" style={{ whiteSpace: 'nowrap' }}>{r.user}</td>
                <td className="t-b2 c1" style={{ minWidth: 280 }}>{r.query}</td>
                <td><span className="status" style={{ color: TONE[r.tone], whiteSpace: 'nowrap' }}><span className="dot" style={{ background: TONE[r.tone] }} />{r.result}</span></td>
                <td>
                  <div className="cell-stack">
                    <span className="t-b25 c2">{r.sources}</span>
                    <span className="t-b3" style={{ color: r.sourceNoteTone === 'bad' ? 'var(--red)' : 'var(--text-3)' }}>{r.sourceNote}</span>
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

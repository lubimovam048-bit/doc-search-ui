import type { ReactNode } from 'react';
import Icon from '../../components/Icon';
import { SOURCES } from '../../data/sources';

/** Функция отрисовки сноски: знает нумерацию и какой источник сейчас раскрыт. */
export type RenderCite = (sourceId: string, label: string) => ReactNode;
export type PickSource = (sourceId: string) => void;

/* 1. Список документов */
export function ListAnswer({ openId, onPick, indexOf }: { openId: string | null; onPick: PickSource; indexOf: (id: string) => number }) {
  const docs = [
    { id: 's_method', why: 'Основной документ: критерии, веса и порядок расчёта итогового балла.' },
    { id: 's_order', why: 'Вводит методику в действие с 01.04.2026 и назначает ответственных за рейтинг.' },
    { id: 's_protocol', why: 'Содержит решение о коэффициенте для объектов вокзальной инфраструктуры.' },
  ];
  return (
    <div className="answer">
      <p className="t-blog c2 lead">
        По результатам анализа документов найдено <span className="c1">три документа</span>, относящихся к методике ранжирования объектов.
        Действующая методика указана под номером 1; приказ и протокол поясняют порядок её ввода и применения.
      </p>
      {docs.map((d) => (
        <div key={d.id} className="row rise">
          <span className={`cn${openId === d.id ? ' cn--on' : ''}`}>{indexOf(d.id)}</span>
          <div className="stack stack--8" style={{ minWidth: 0, flex: 1 }}>
            <span className="t-b1 c1">{SOURCES[d.id].title}</span>
            <span className="t-blog c2">{d.why}</span>
            <div><button className="btn-link t-btn2" onClick={() => onPick(d.id)}>Перейти к источнику</button></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* 2. Сводка с постатейными сносками (и вариант «источник удалён») */
export function SummaryAnswer({ deleted, cite }: { deleted: boolean; cite: RenderCite }) {
  // хронология по датам документов-источников
  const items = deleted
    ? [
        { date: '10.09', text: 'Основание перрона выполнено по проекту, работы приняты.', id: 's_del', label: 'Акт приёмки № 12 · документ удалён' },
        { date: '25.09', text: 'Организована приёмка металлоконструкций на площадке в две смены, ответственный — начальник участка № 2.', id: 's_prot2', label: 'Протокол штаба от 25.09.2026, стр. 2' },
      ]
    : [
        { date: '22.09', text: 'Подрядчику направлено уведомление о начислении неустойки за просрочку поставки.', id: 's_letter', label: 'Письмо № 118 от 22.09.2026, стр. 1' },
        { date: '25.09', text: 'Организована приёмка металлоконструкций на площадке в две смены, ответственный — начальник участка № 2.', id: 's_prot2', label: 'Протокол штаба от 25.09.2026, стр. 2' },
        { date: '03.10', text: 'Поставка металлоконструкций перенесена с 15.09.2026 на 30.09.2026 по дополнительному соглашению № 3. Отставание от плана — 15 дней.', id: 's_rep7', label: 'Отчёт за сентябрь 2026, стр. 7' },
      ];
  return (
    <div className="answer">
      {deleted && (
        <div className="card2 notice">
          <Icon name="warn" size={20} color="var(--er-color-warning)" />
          <div className="stack stack--8">
            <span className="t-sub3 c-orange">Один из источников удалён</span>
            <span className="t-blog c2">
              Ответ сохранён в том виде, в каком он был выдан 12.09.2026. Первый документ удалён администратором 28.09.2026,
              поэтому проверить этот пункт по оригиналу нельзя.
            </span>
          </div>
        </div>
      )}
      <h2 className="ans-title">
        {deleted ? 'Основание перрона: что сделано' : 'По задержке поставки приняты три меры'}
      </h2>
      <ol className="timeline">
        {items.map((it) => (
          <li key={it.id} className="timeline__item rise">
            <span className="timeline__date">{it.date}</span>
            <span className="timeline__dot" aria-hidden="true" />
            <div className="stack stack--12" style={{ minWidth: 0 }}>
              <span className="t-blog c2">{it.text}</span>
              <div>{cite(it.id, it.label)}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* 3. Факт из таблицы */
export function TableAnswer({ cite }: { cite: RenderCite }) {
  return (
    <div className="answer answer--gap16">
      <div className="card1 fact-card rise">
        <div className="stack stack--8">
          <span className="t-b25 c3">Ответственный за устройство перронов</span>
          <span className="t-h3 c1">Соколов Андрей Петрович</span>
          <span className="t-blog c2">Начальник участка № 2, подрядчик</span>
        </div>
        <div className="fact-card__sep" />
        <div className="stack stack--8">
          <span className="t-b25 c3">Контроль со стороны заказчика</span>
          <span className="t-sub2 c1">Миронова Е. В.</span>
          <span className="t-blog c2">Главный инженер проекта</span>
        </div>
        <div>{cite('s_resp', 'Таблица ответственных, стр. 2')}</div>
      </div>
      <span className="t-b25 c3">
        Ответ взят из одной строки таблицы. Она выделена в источнике ниже: проверьте вид работ и заголовки столбцов.
      </span>
    </div>
  );
}

/* 4. Статус объекта: только числа, которые есть в документах, и со ссылками */
export function StatusAnswer({ cite }: { cite: RenderCite }) {
  const rows = [
    { label: 'Согласование', chip: 'Согласовано', color: 'var(--er-color-success)', text: 'Рабочая документация согласована, положительное заключение экспертизы получено 19.08.2026.', id: 's_expert', cl: 'Заключение экспертизы, стр. 1' },
    { label: 'Что строится сейчас', chip: 'В работе', color: 'var(--er-color-warning)', text: 'Монолитные работы 1-го этажа выполнены на 65 %. Монтаж каркаса перрона запланирован на 20.10.2026.', id: 's_rep5', cl: 'Отчёт за сентябрь 2026, стр. 5' },
    { label: 'Проблемы и риски', chip: 'Есть риск', color: 'var(--er-color-danger)', text: 'Поставка металлоконструкций сдвинулась на 15 дней. Влияние на критический путь оценивается как умеренное.', id: 's_rep7', cl: 'Отчёт за сентябрь 2026, стр. 7' },
  ];
  return (
    <div className="answer answer--gap20">
      <div className="hstack" style={{ gap: 20, flexWrap: 'nowrap' }}>
        <div className="badge badge--xl"><Icon name="station" size={30} stroke={1.5} /></div>
        <div className="stack stack--8">
          <span className="t-sub1 c1">Вокзальный комплекс ст. Заречная</span>
          <span className="t-b2 c3 hstack hstack--8" style={{ flexWrap: 'nowrap' }}>
            <Icon name="circleCheck" size={18} stroke={1.8} color="var(--er-color-success)" />
            По документам на 03.10.2026
          </span>
        </div>
      </div>

      <div className="card1 accent fact-card--blue rise">
        <div className="accent__head">
          <div>
            <div className="accent__label">Общая готовность</div>
            <div className="accent__value">70%</div>
          </div>
          {cite('s_rep3', 'Отчёт за сентябрь 2026, стр. 3')}
        </div>
        <div className="progress progress--lg" role="progressbar" aria-valuenow={70} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress__bar" style={{ width: '70%' }} />
        </div>
        <div className="accent__foot">
          <span>4 из 6 этапов завершены</span>
          <span>Дальше: монтаж каркаса, 20.10</span>
        </div>
      </div>

      <div className="stack">
        {rows.map((r) => (
          <div key={r.id} className="row rise" style={{ flexDirection: 'column', gap: 12 }}>
            <div className="hstack hstack--12" style={{ justifyContent: 'space-between' }}>
              <span className="t-sub3 c1">{r.label}</span>
              <span className="status" style={{ color: r.color }}><span className="dot" style={{ background: r.color }} />{r.chip}</span>
            </div>
            <span className="t-blog c2">{r.text}</span>
            <div>{cite(r.id, r.cl)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 5. Расхождение: два значения со ссылками, без вердикта */
export function DivergeAnswer({ cite }: { cite: RenderCite }) {
  const cards = [
    { cls: 'diverge__card--a', tag: 'Источник A', value: '15.11.2026', source: 'План реализации, ред. от 10.06.2026', meta: 'стр. 3 · загружен 11.06.2026', id: 's_plan3' },
    { cls: 'diverge__card--b', tag: 'Источник B', value: '02.12.2026', source: 'Отчёт о ходе строительства за сентябрь 2026', meta: 'стр. 5 · загружен 03.10.2026', id: 's_rep5' },
  ];
  return (
    <div className="answer answer--gap16">
      <div className="stack stack--8">
        <span className="t-sub2 c-orange">Данные в источниках расходятся</span>
        <span className="t-blog c2">
          Срок завершения монолитных работ указан по-разному. Вывод о том, какое значение верно, не формируется: оба источника приведены ниже.
        </span>
      </div>
      <div className="diverge">
        {cards.map((c) => (
          <div key={c.id} className={`card2 diverge__card ${c.cls} rise`}>
            <span className="t-b25 c3">{c.tag}</span>
            <span className="t-h3 c1">{c.value}</span>
            <div className="stack stack--8">
              <span className="t-b1 c2">{c.source}</span>
              <span className="t-cap1 c3">{c.meta}</span>
            </div>
            <div>{cite(c.id, 'Открыть фрагмент')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Не найдено: честно говорим об этом */
export function EmptyAnswer({ scopeText, onResetScope, onReportMissing }: { scopeText: string; onResetScope: () => void; onReportMissing: () => void }) {
  return (
    <div className="card1 answer" style={{ padding: 28, gap: 16 }}>
      <span className="t-sub2 c1">В загруженных документах информация по запросу не найдена.</span>
      <span className="t-blog c2">
        Поиск выполнен в области: {scopeText}. Возможные причины: документ не загружен, объект назван иначе, период указан неверно.
      </span>
      <div className="hstack hstack--12">
        <button className="btn-p t-btn2" onClick={onResetScope}>Искать по всей базе</button>
        <button className="ghost t-btn2" onClick={onReportMissing}>Сообщить, что документа не хватает</button>
      </div>
    </div>
  );
}

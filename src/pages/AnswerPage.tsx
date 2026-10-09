import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Cite from '../components/Cite';
import Icon from '../components/Icon';
import SearchField, { type SearchFieldHandle } from '../components/SearchField';
import { useApp } from '../context/AppContext';
import { DEFAULT_FILTERS, describeScope } from '../data/filters';
import { FOLLOW_UPS, SCENARIOS } from '../data/scenarios';
import { SOURCES } from '../data/sources';
import {
  DivergeAnswer, EmptyAnswer, ListAnswer, StatusAnswer, SummaryAnswer, TableAnswer,
} from '../features/search/AnswerViews';
import Clarify from '../features/search/Clarify';
import SourceCards from '../features/search/SourceCards';
import DocPane, { LIST_TAB } from '../features/search/DocPane';

const FEEDBACK_TEXT: Record<string, string> = {
  copied: 'Ответ скопирован.',
  copyfail: 'Не удалось скопировать. Выделите текст вручную.',
  ok: 'Спасибо, оценка сохранена.',
  bad: 'Спасибо, отметка «неточно» сохранена.',
  src: 'Спасибо, отметка «источник не тот» передана администратору.',
  missing: 'Запрос передан администратору с пометкой «не хватает документа».',
};

/** Цвет плашки типа ответа: обычный ответ, предупреждение, пустой результат. */
const TYPE_TONE: Record<string, 'info' | 'warning' | 'neutral'> = {
  list: 'info', summary: 'info', table: 'info', status: 'info',
  diverge: 'warning', deleted: 'warning', empty: 'neutral',
};

export default function AnswerPage() {
  const { id } = useParams();
  const { history, ask, setClarify } = useApp();
  const navigate = useNavigate();
  const entry = history.find((h) => h.id === id);
  const scenario = entry ? SCENARIOS[entry.scenario] : null;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string>(LIST_TAB);
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const answerRef = useRef<HTMLDivElement>(null);
  const field = useRef<SearchFieldHandle>(null);

  // при переходе к другому запросу раскрываем первый источник и сбрасываем оценку
  useEffect(() => {
    setOpenId(null);
    setTabs([]);
    setActive(LIST_TAB);
    setHidden(false);
    setEditing(false);
    setFeedback('');
  }, [id, scenario]);

  if (!entry || !scenario) return <Navigate to="/" replace />;

  const sources = scenario.sources.map((sid) => SOURCES[sid]);
  const indexOf = (sid: string) => scenario.sources.indexOf(sid) + 1;
  const pick = (sid: string) => {
    setOpenId(sid);
    document.getElementById(`src-${sid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const openDoc = (sid: string) => {
    setHidden(false);
    setOpenId(sid);
    setTabs((t) => (t.includes(sid) ? t : [...t, sid]));
    setActive(sid);
  };
  const activate = (id: string) => { setActive(id); setOpenId(id === LIST_TAB ? null : id); };
  const closeTab = (sid: string) => {
    const rest = tabs.filter((x) => x !== sid);
    setTabs(rest);
    if (rest.length === 0) setHidden(false);
    if (active === sid) {
      const i = tabs.indexOf(sid);
      const next = rest[i] ?? rest[i - 1] ?? LIST_TAB;
      setActive(next);
      setOpenId(next === LIST_TAB ? null : next);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(answerRef.current?.innerText ?? '');
      setFeedback('copied');
    } catch {
      setFeedback('copyfail');
    }
  };
  const viewing = tabs.length > 0 && !hidden;
  const scope = entry.clarify && entry.clarify !== 'pending' ? entry.clarify : null;
  const asking = entry.clarify === 'pending' || editing;
  const docsText = sources.length === 1 ? 'в 1 документе' : `в ${sources.length} документах`;

  const cite = (sid: string, label: string) => (
    <Cite n={indexOf(sid)} label={label} active={openId === sid} deleted={SOURCES[sid].kind === 'deleted'} onClick={() => (SOURCES[sid].kind === 'deleted' ? pick(sid) : openDoc(sid))} />
  );

  const view = (() => {
    switch (scenario.id) {
      case 'list': return <ListAnswer />;
      case 'summary': return <SummaryAnswer deleted={false} cite={cite} />;
      case 'deleted': return <SummaryAnswer deleted cite={cite} />;
      case 'table': return <TableAnswer cite={cite} />;
      case 'status': return <StatusAnswer cite={cite} />;
      case 'diverge': return <DivergeAnswer cite={cite} />;
      case 'empty':
        return (
          <EmptyAnswer
            scopeText={describeScope(filters)}
            onResetScope={() => setFilters(DEFAULT_FILTERS)}
            onReportMissing={() => setFeedback('missing')}
          />
        );
    }
  })();

  return (
    <main className={`main main--answer${viewing ? ' main--doc' : ''}`}>
      <div className="ans">
        {hidden && tabs.length > 0 && (
          <div className="ans__restore">
            <button className="ghost t-btn2 hstack hstack--8" style={{ flexWrap: 'nowrap' }} onClick={() => setHidden(false)}>
              <Icon name="layers" size={16} />Документы · {tabs.length}
            </button>
          </div>
        )}
        <div className="ans__q">{entry.query}</div>

        {asking && (
          <Clarify
            initial={scope ?? undefined}
            onDone={(sc) => { setClarify(entry.id, sc); setEditing(false); }}
            onCancel={scope ? () => setEditing(false) : undefined}
          />
        )}

        {!asking && (
          <>
            {scope && (
              <div className="ans__scope">
                <span>Уточнено: {scope.object} · {scope.period}</span>
                <button onClick={() => setEditing(true)}>Изменить</button>
              </div>
            )}
        <div className="ans__trust">
          <span className={`ans__type ans__type--${TYPE_TONE[scenario.id]}`}>{scenario.type}</span>
          {sources.length > 0 && <span>Найдено {docsText}</span>}
          {scenario.asOf && <span>{scenario.asOf}</span>}
        </div>

        <div ref={answerRef}>{view}</div>

        <SourceCards sources={sources} activeId={openId} onOpen={openDoc} />

        {scenario.id !== 'empty' && (
          <div className="feedback">
            <button className="ghost t-btn2 hstack hstack--8" style={{ flexWrap: 'nowrap' }} onClick={copy}>
              <Icon name="doc" size={16} />Копировать
            </button>
            <span className="t-b25 c3" style={{ margin: '0 4px 0 8px' }}>Оценить ответ</span>
            <button className="ghost t-btn2" onClick={() => setFeedback('ok')}>Полезно</button>
            <button className="ghost t-btn2" onClick={() => setFeedback('bad')}>Неточно</button>
            <button className="btn-text t-btn2" onClick={() => setFeedback('src')}>Источник не тот</button>
          </div>
        )}
        {feedback && <span className="t-b25 cg" role="status">{FEEDBACK_TEXT[feedback]}</span>}

        <section className="related" aria-label="Связанные вопросы">
          <h2 className="related__title">Связанные вопросы</h2>
          <ul className="related__list">
            {FOLLOW_UPS[scenario.id].map((q) => (
              <li key={q}>
                <button className="related__item" onClick={() => field.current?.ask(q)}>
                  <Icon name="search" size={16} />
                  <span>{q}</span>
                  <Icon name="arrow" size={16} className="related__go" />
                </button>
              </li>
            ))}
          </ul>
        </section>

          </>
        )}

        <div className="composer">
          <SearchField ref={field} onSubmit={(q) => navigate(`/q/${ask(q).id}`)} />
          <span className="t-cap1 c3 composer__note">Запросы сохраняются и доступны администратору.</span>
        </div>
      </div>

      {viewing && (
        <DocPane
          sources={sources.filter((x) => x.kind !== 'deleted')}
          tabs={tabs}
          active={active}
          onActivate={activate}
          onOpen={openDoc}
          onCloseTab={closeTab}
          onHide={() => setHidden(true)}
          docUrl={(sid) => `${window.location.href.split('#')[0]}#/doc/${sid}?from=${entry.id}`}
        />
      )}
    </main>
  );
}

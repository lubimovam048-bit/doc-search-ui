import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Cite from '../components/Cite';
import Icon from '../components/Icon';
import SearchField from '../components/SearchField';
import { useApp } from '../context/AppContext';
import { DEFAULT_FILTERS, describeScope } from '../data/filters';
import { FOLLOW_UPS, SCENARIOS } from '../data/scenarios';
import { SOURCES } from '../data/sources';
import {
  DivergeAnswer, EmptyAnswer, ListAnswer, StatusAnswer, SummaryAnswer, TableAnswer,
} from '../features/search/AnswerViews';
import SourceCards from '../features/search/SourceCards';
import DocPane from '../features/search/DocPane';

const FEEDBACK_TEXT: Record<string, string> = {
  copied: 'Ответ скопирован.',
  copyfail: 'Не удалось скопировать. Выделите текст вручную.',
  ok: 'Спасибо, оценка сохранена.',
  bad: 'Спасибо, отметка «неточно» сохранена.',
  src: 'Спасибо, отметка «источник не тот» передана администратору.',
  missing: 'Запрос передан администратору с пометкой «не хватает документа».',
};

export default function AnswerPage() {
  const { id } = useParams();
  const { history, ask } = useApp();
  const navigate = useNavigate();
  const entry = history.find((h) => h.id === id);
  const scenario = entry ? SCENARIOS[entry.scenario] : null;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const answerRef = useRef<HTMLDivElement>(null);

  // при переходе к другому запросу раскрываем первый источник и сбрасываем оценку
  useEffect(() => {
    setOpenId(null);
    setViewId(null);
    setFeedback('');
  }, [id, scenario]);

  if (!entry || !scenario) return <Navigate to="/" replace />;

  const sources = scenario.sources.map((sid) => SOURCES[sid]);
  const indexOf = (sid: string) => scenario.sources.indexOf(sid) + 1;
  const pick = (sid: string) => {
    setOpenId(sid);
    document.getElementById(`src-${sid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const openDoc = (sid: string) => { setOpenId(sid); setViewId(sid); };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(answerRef.current?.innerText ?? '');
      setFeedback('copied');
    } catch {
      setFeedback('copyfail');
    }
  };
  const viewing = sources.find((x) => x.id === viewId) ?? null;
  const docsText = sources.length === 1 ? 'в 1 документе' : `в ${sources.length} документах`;

  const cite = (sid: string, label: string) => (
    <Cite n={indexOf(sid)} label={label} active={openId === sid} deleted={SOURCES[sid].kind === 'deleted'} onClick={() => pick(sid)} onOpen={() => openDoc(sid)} />
  );

  const view = (() => {
    switch (scenario.id) {
      case 'list': return <ListAnswer openId={openId} onPick={pick} indexOf={indexOf} />;
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
        <div className="ans__q">{entry.query}</div>

        <div className="ans__trust">
          <span className="ans__type">{scenario.type}</span>
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

        <div className="followups" aria-label="Что спросить дальше">
          <span className="t-b25 c3">Что спросить дальше</span>
          <div className="followups__list">
            {FOLLOW_UPS[scenario.id].map((q) => (
              <button key={q} className="followups__chip" onClick={() => navigate(`/q/${ask(q).id}`)}>{q}</button>
            ))}
          </div>
        </div>

        <div className="composer">
          <SearchField onSubmit={(q) => navigate(`/q/${ask(q).id}`)} />
          <span className="t-cap1 c3 composer__note">Запросы сохраняются и доступны администратору.</span>
        </div>
      </div>

      {viewing && (
        <DocPane
          sources={sources.filter((x) => x.kind !== 'deleted')}
          current={viewing}
          onSelect={openDoc}
          onClose={() => setViewId(null)}
        />
      )}
    </main>
  );
}

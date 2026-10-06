import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Cite from '../components/Cite';
import Icon from '../components/Icon';
import SearchField from '../components/SearchField';
import { useApp } from '../context/AppContext';
import { DEFAULT_FILTERS, describeScope } from '../data/filters';
import { SCENARIOS } from '../data/scenarios';
import { SOURCES } from '../data/sources';
import {
  DivergeAnswer, EmptyAnswer, ListAnswer, StatusAnswer, SummaryAnswer, TableAnswer,
} from '../features/search/AnswerViews';
import SourcesPanel from '../features/search/SourcesPanel';

const FEEDBACK_TEXT: Record<string, string> = {
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
  const [panelOpen, setPanelOpen] = useState(true);
  const [feedback, setFeedback] = useState('');

  // при переходе к другому запросу раскрываем первый источник и сбрасываем оценку
  useEffect(() => {
    setOpenId(scenario?.sources[0] ?? null);
    setPanelOpen(true);
    setFeedback('');
  }, [id, scenario]);

  if (!entry || !scenario) return <Navigate to="/" replace />;

  const sources = scenario.sources.map((sid) => SOURCES[sid]);
  const indexOf = (sid: string) => scenario.sources.indexOf(sid) + 1;
  const pick = (sid: string) => { setOpenId(sid); setPanelOpen(true); };

  const cite = (sid: string, label: string) => (
    <Cite n={indexOf(sid)} label={label} active={openId === sid} deleted={SOURCES[sid].kind === 'deleted'} onClick={() => pick(sid)} />
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
    <>
      <main className="main">
        {!panelOpen && sources.length > 0 && (
          <div className="hstack" style={{ justifyContent: 'flex-end' }}>
            <button className="ghost t-btn2 hstack hstack--8" onClick={() => setPanelOpen(true)} style={{ flexWrap: 'nowrap' }}>
              <Icon name="layers" size={16} />Источники · {sources.length}
            </button>
          </div>
        )}

        <div className="stack stack--4" style={{ paddingTop: 8 }}>
          <span className="t-cap1 c3">Вопрос</span>
          <span className="t-sub2 c1">{entry.query}</span>
        </div>
        <div className="hstack hstack--12">
          <span className="t-b25 c2">{scenario.type}</span>
          {scenario.asOf && <span className="t-b25 c3">· {scenario.asOf}</span>}
        </div>
        <span className="t-cap1 c3" style={{ marginTop: -8 }}>Запрос понят как: {scenario.understood}</span>

        {view}

        <div className="feedback">
          {scenario.id !== 'empty' && (
            <>
              <span className="t-b25 c3" style={{ marginRight: 4 }}>Оценить ответ</span>
              <button className="ghost t-btn2" onClick={() => setFeedback('ok')}>Полезно</button>
              <button className="ghost t-btn2" onClick={() => setFeedback('bad')}>Неточно</button>
              <button className="btn-text t-btn2" onClick={() => setFeedback('src')}>Источник не тот</button>
            </>
          )}
          {feedback && <span className="t-b25 cg" role="status">{FEEDBACK_TEXT[feedback]}</span>}
        </div>

        <div className="composer">
          <SearchField onSubmit={(q) => navigate(`/q/${ask(q).id}`)} />
          <span className="t-cap1 c3 composer__note">Запросы сохраняются и доступны администратору.</span>
        </div>
      </main>

      {panelOpen && (
        <SourcesPanel
          sources={sources}
          openId={openId}
          onToggle={(sid) => setOpenId((cur) => (cur === sid ? null : sid))}
          onCollapseAll={() => setOpenId(null)}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}

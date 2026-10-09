import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { SOURCES } from '../data/sources';
import { DocActions, DocSheet } from '../features/search/DocView';

/** Отдельная страница документа: открывается в новой вкладке и по ссылке. */
export default function DocumentPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const from = params.get('from');
  const [big, setBig] = useState(false);
  const source = SOURCES[id];

  useEffect(() => {
    if (source) document.title = `${source.title} · Поиск по документам`;
  }, [source]);

  if (!source || source.kind === 'deleted') return <Navigate to="/" replace />;

  return (
    <div className="docscreen">
      <header className="docscreen__bar">
        {from && <Link className="docscreen__back" to={`/q/${from}`}><Icon name="arrow" size={16} />К ответу</Link>}
        <div className="docpane__titles">
          <b>{source.title}</b>
          <span>{source.meta}</span>
        </div>
        <div className="docpane__tools">
          <button onClick={() => setBig((v) => !v)} aria-pressed={big} aria-label="Увеличить текст" title="Увеличить текст"><Icon name="zoom" size={16} /></button>
        </div>
      </header>
      <DocActions source={source} docUrl={window.location.href} />
      <main className="docscreen__body">
        <DocSheet source={source} big={big} />
      </main>
    </div>
  );
}

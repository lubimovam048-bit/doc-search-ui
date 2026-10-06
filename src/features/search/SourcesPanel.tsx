import Icon from '../../components/Icon';
import { RESP_TABLE } from '../../data/sources';
import type { Source } from '../../data/types';

interface Props {
  sources: Source[];
  openId: string | null;
  onToggle: (id: string) => void;
  onCollapseAll: () => void;
  onClose: () => void;
}

export default function SourcesPanel({ sources, openId, onToggle, onCollapseAll, onClose }: Props) {
  return (
    <section aria-label="Источники" className="card1 sources">
      <div className="sources__head">
        <span className="t-sub3 c1">Источники <span className="c3" style={{ fontWeight: 400 }}>· {sources.length}</span></span>
        <div className="hstack" style={{ gap: 4 }}>
          <button className="btn-text t-btn2" onClick={onCollapseAll}>Свернуть все</button>
          <button className="btn-icon" onClick={onClose} aria-label="Скрыть источники"><Icon name="chevRight" /></button>
        </div>
      </div>

      {sources.length === 0 && (
        <div className="stack stack--8" style={{ padding: '24px 8px' }}>
          <span className="t-sub3 c1">Источников нет</span>
          <span className="t-blog c2">Ответ без документа не формируется. Когда система найдёт документы, они появятся здесь.</span>
        </div>
      )}

      <div className="sources__list">
        {sources.map((s, i) => {
          const open = openId === s.id;
          const del = s.kind === 'deleted';
          return (
            <div key={s.id} className={`src${open ? ' src--open' : ''}`}>
              <button className="src__head" onClick={() => onToggle(s.id)} aria-expanded={open}>
                <span className={`cn${del ? ' cn--del' : open ? ' cn--on' : ''}`}>{i + 1}</span>
                <span className="src__title">
                  <span className="t-b2" style={{ color: open ? '#fff' : 'var(--text-2)' }}>{s.title}</span>
                  <span className="t-b3 c3">{s.meta}</span>
                </span>
                <Icon name="chevDown" size={16} stroke={1.8} color="var(--text-3)" className={`src__chev${open ? ' src__chev--open' : ''}`} />
              </button>

              {open && s.kind === 'text' && (
                <div className="src__body">
                  <span className="t-blog c3">{s.before}</span>
                  <div className="src__frag"><span className="t-blog c1">{s.frag}</span></div>
                  <span className="t-blog c3">{s.after}</span>
                  <div className="hstack hstack--8">
                    <button className="ghost t-btn2">Открыть в читалке</button>
                    <button className="ghost t-btn2">Копировать ссылку</button>
                  </div>
                </div>
              )}

              {open && s.kind === 'table' && (
                <div className="src__body">
                  <div className="src__table">
                    <table>
                      <thead>
                        <tr>{RESP_TABLE.head.map((h) => <th key={h} className="t-btn2 c2">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {RESP_TABLE.rows.map((r) => (
                          <tr key={r.work} className={r.hl ? 'hl' : ''}>
                            <td className={`t-b25 ${r.hl ? 'c1' : 'c2'}`}>{r.work}</td>
                            <td className="t-b25 c1" style={r.hl ? { padding: '6px 8px' } : undefined}>
                              {r.hl ? <span className="cell-mark">{r.who}</span> : <span className="c2">{r.who}</span>}
                            </td>
                            <td className={`t-b25 ${r.hl ? 'c1' : 'c2'}`}>{r.control}</td>
                            <td className={`t-b25 ${r.hl ? 'c2' : 'c3'}`}>{r.due}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="t-cap1 c3">Выделена строка, на которой основан ответ. Заголовки столбцов показаны для проверки.</span>
                </div>
              )}

              {open && del && (
                <div className="src__body">
                  <span className="t-b25 c-red">Документ удалён администратором 28.09.2026. Открыть его нельзя.</span>
                  <div className="card2 stack stack--8" style={{ padding: 14 }}>
                    <span className="t-b3 c3">Фрагмент на момент запроса</span>
                    <span className="t-blog c2">{s.frag}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

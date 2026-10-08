import SidePanel from '../../components/SidePanel';
import { RESP_TABLE } from '../../data/sources';
import type { Source } from '../../data/types';

/** Просмотр документа поверх страницы, найденный фрагмент выделен. */
export default function SourceViewer({ source, onClose }: { source: Source; onClose: () => void }) {
  return (
    <SidePanel wide title={source.title} subtitle={source.meta} onClose={onClose}>
      <div className="paper">
        {source.kind === 'text' && (
          <>
            <span className="paper__line" /><span className="paper__line paper__line--s" />
            <p className="t-blog c3">{source.before}</p>
            <p className="t-blog paper__mark">{source.frag}</p>
            <p className="t-blog c3">{source.after}</p>
            <span className="paper__line" /><span className="paper__line paper__line--s" />
          </>
        )}
        {source.kind === 'table' && (
          <div className="src__table">
            <table>
              <thead><tr>{RESP_TABLE.head.map((h) => <th key={h} className="t-btn2 c2">{h}</th>)}</tr></thead>
              <tbody>
                {RESP_TABLE.rows.map((r) => (
                  <tr key={r.work} className={r.hl ? 'hl' : ''}>
                    <td className="t-b25">{r.work}</td>
                    <td className="t-b25">{r.hl ? <span className="cell-mark">{r.who}</span> : r.who}</td>
                    <td className="t-b25">{r.control}</td>
                    <td className="t-b25">{r.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SidePanel>
  );
}

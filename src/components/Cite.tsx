import Icon from './Icon';

interface Props {
  n: number;
  label: string;
  active: boolean;
  deleted?: boolean;
  onClick: () => void;
}

/** Сноска-плашка: номер источника + подпись. Одно действие: открывает документ на нужной странице (у удалённых источников показывает карточку). */
export default function Cite({ n, label, active, deleted, onClick }: Props) {
  return (
    <button className={`cite${active ? ' cite--on' : ''}`} onClick={onClick} title={deleted ? 'Документ удалён' : 'Открыть документ'}>
      <span className={`cn${deleted ? ' cn--del' : active ? ' cn--on' : ''}`}>{n}</span>
      <span>{label}</span>
      {!deleted && <Icon name="external" size={14} className="cite__ico" />}
    </button>
  );
}

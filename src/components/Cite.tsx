import Icon from './Icon';

interface Props {
  n: number;
  label: string;
  active: boolean;
  deleted?: boolean;
  onClick: () => void;
  /** Открыть документ на нужной странице. Для удалённых источников не передаётся. */
  onOpen?: () => void;
}

/** Сноска-плашка: номер источника + подпись. Клик по плашке подсвечивает карточку под ответом, иконка открывает документ. */
export default function Cite({ n, label, active, deleted, onClick, onOpen }: Props) {
  return (
    <span className="cite-wrap">
      <button className={`cite${active ? ' cite--on' : ''}`} onClick={onClick}>
        <span className={`cn${deleted ? ' cn--del' : active ? ' cn--on' : ''}`}>{n}</span>
        <span>{label}</span>
      </button>
      {onOpen && !deleted && (
        <button className="cite__open" onClick={onOpen} aria-label={`Открыть документ: ${label}`} title="Открыть документ">
          <Icon name="external" size={15} />
        </button>
      )}
    </span>
  );
}

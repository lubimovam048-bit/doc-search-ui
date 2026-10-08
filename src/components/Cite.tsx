interface Props {
  n: number;
  label: string;
  active: boolean;
  deleted?: boolean;
  onClick: () => void;
}

/** Сноска-плашка: номер источника + подпись. Клик подсвечивает карточку источника под ответом. */
export default function Cite({ n, label, active, deleted, onClick }: Props) {
  return (
    <button className={`cite${active ? ' cite--on' : ''}`} onClick={onClick}>
      <span className={`cn${deleted ? ' cn--del' : active ? ' cn--on' : ''}`}>{n}</span>
      <span>{label}</span>
    </button>
  );
}

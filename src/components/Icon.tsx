const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevLeft: <path d="M15 6l-6 6 6 6" />,
  chevRight: <path d="M9 6l6 6-6 6" />,
  chevDown: <path d="M6 9l6 6 6-6" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />,
  check: <path d="M5 12l5 5 9-10" />,
  circleCheck: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  warn: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></>,
  station: <><path d="M3 10l9-6 9 6" /><path d="M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
} as const;

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 18, stroke = 1.6, color = 'currentColor', className, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}

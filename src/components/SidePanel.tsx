import { createPortal } from 'react-dom';
import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** Панель справа поверх страницы: просмотр документа, детали записи журнала. */
export default function SidePanel({ title, subtitle, onClose, children, footer, wide }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={`sidepanel${wide ? ' sidepanel--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sidepanel__head">
          <div className="stack stack--4" style={{ minWidth: 0 }}>
            <span className="t-sub2 c1">{title}</span>
            {subtitle && <span className="t-b25 c3">{subtitle}</span>}
          </div>
          <button ref={closeRef} className="btn-icon" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={20} /></button>
        </div>
        <div className="sidepanel__body">{children}</div>
        {footer && <div className="sidepanel__foot">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

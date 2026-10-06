import { createPortal } from 'react-dom';
import { useEffect, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
  wide?: boolean;
}

/** Окно подтверждения или короткой формы. */
export default function Dialog({ title, onClose, children, actions, wide }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="scrim scrim--center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dialog${wide ? ' dialog--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="t-sub1 c1">{title}</h2>
        <div className="dialog__body">{children}</div>
        <div className="dialog__actions">{actions}</div>
      </div>
    </div>,
    document.body,
  );
}

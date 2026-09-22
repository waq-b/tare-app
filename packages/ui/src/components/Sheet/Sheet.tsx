import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Sticky actions at the bottom (e.g. Save). */
  footer?: ReactNode;
  /** `auto` fits content; `tall` fills most of the screen. */
  height?: 'auto' | 'tall';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Bottom sheet with grabber, title and close, over a scrim. Positioned in the nearest
 * positioned ancestor (the screen), so it inherits that screen's theme. Traps focus while
 * open, closes on Escape or a scrim tap, and returns focus when it closes. */
export function Sheet({ open, title, onClose, children, footer, height = 'auto' }: SheetProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  // UI-only effect: move focus into the dialog and restore it after.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? ref.current)?.focus();
    return () => previous?.focus();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={styles['layer']}>
      <div className={styles['scrim']} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${styles['sheet']} ${height === 'tall' ? styles['tall'] : ''}`}
        onKeyDown={onKeyDown}
      >
        <span className={styles['grabber']} aria-hidden="true" />
        <div className={styles['head']}>
          <h2 id={titleId} className={styles['title']}>
            {title}
          </h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        <div className={styles['body']}>{children}</div>
        {footer ? <div className={styles['footer']}>{footer}</div> : null}
      </div>
    </div>
  );
}

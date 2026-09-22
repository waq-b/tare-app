import { Icon, type IconName } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './InlineNote.module.css';

export interface InlineNoteProps {
  children: ReactNode;
  /** `info` (default), `synced` (cloud-ok, progress icon), `imported` (download icon). */
  kind?: 'info' | 'synced' | 'imported';
  icon?: IconName;
}

const ICON: Record<NonNullable<InlineNoteProps['kind']>, IconName> = {
  info: 'info',
  synced: 'cloud-ok',
  imported: 'download',
};

/** A small icon + muted line: "Includes 1 change you accepted on Sunday", "Synced · 19:42". */
export function InlineNote({ children, kind = 'info', icon }: InlineNoteProps) {
  return (
    <p className={cx(styles['note'], styles[kind])}>
      <Icon name={icon ?? ICON[kind]} size={16} />
      <span>{children}</span>
    </p>
  );
}

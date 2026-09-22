import { cx } from '../../lib/cx';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  shape?: 'line' | 'tile' | 'block';
  width?: number | string;
  height?: number | string;
}

/** A placeholder block while loading. Decorative: the container sets aria-busy and a label. */
export function Skeleton({ shape = 'line', width, height }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles['sk'], styles[shape])}
      style={{ width, height }}
    />
  );
}

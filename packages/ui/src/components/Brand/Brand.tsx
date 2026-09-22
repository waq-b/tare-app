import styles from './Brand.module.css';

/** The miniquest family's pixel pip: a 5×5 sprite, drawn crisp at any size. */
const PIP = [
  [2, 0],
  [1, 1],
  [2, 1],
  [3, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [3, 2],
  [4, 2],
  [1, 3],
  [3, 3],
  [0, 4],
  [4, 4],
] as const;

export function MiniquestPip({ size = 10 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 5 5"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={styles['pip']}
    >
      {PIP.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  );
}

/** "a miniquest" family tag: pip + Silkscreen. Every miniquest app carries it. */
export function MiniquestTag() {
  return (
    <span className={styles['tag']}>
      <MiniquestPip size={10} />a miniquest
    </span>
  );
}

export interface WordmarkProps {
  /** Font size of "tare" in px. The badge scales with it. */
  size?: number;
  /** The "0.0" badge: the zeroed scale. */
  badge?: boolean;
}

/** "tare" in Azeret Mono with the zeroed-scale badge. A brand asset, not type. */
export function Wordmark({ size = 60, badge = true }: WordmarkProps) {
  return (
    <span className={styles['wordmark']} style={{ fontSize: size }} role="img" aria-label="Tare">
      <span aria-hidden="true">tare</span>
      {badge ? (
        <span aria-hidden="true" className={styles['badge']}>
          0.0
        </span>
      ) : null}
    </span>
  );
}

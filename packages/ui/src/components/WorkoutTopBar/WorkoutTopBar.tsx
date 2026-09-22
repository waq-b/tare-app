import { IconButton } from '../IconButton/IconButton';
import styles from './WorkoutTopBar.module.css';

export interface WorkoutTopBarProps {
  sessionName: string;
  /** Elapsed time, already formatted ("12:40"). The app ticks it. */
  elapsed: string;
  minimiseHref?: string;
  onMinimise?: () => void;
  flagPainHref?: string;
  onFlagPain?: () => void;
}

/** Active-workout header: minimise, session name + clock, flag pain (always one tap away). */
export function WorkoutTopBar({
  sessionName,
  elapsed,
  minimiseHref,
  onMinimise,
  flagPainHref,
  onFlagPain,
}: WorkoutTopBarProps) {
  return (
    <header className={styles['bar']}>
      <IconButton
        icon="chev-d"
        label="Minimise workout"
        {...(minimiseHref ? { href: minimiseHref } : {})}
        {...(onMinimise ? { onClick: onMinimise } : {})}
      />
      <div className={styles['centre']}>
        <p className={styles['name']}>{sessionName}</p>
        <p className={styles['clock']}>
          <span className="sr-only">Elapsed </span>
          {elapsed}
        </p>
      </div>
      <IconButton
        icon="flag"
        label="Flag pain"
        variant="outlined"
        {...(flagPainHref ? { href: flagPainHref } : {})}
        {...(onFlagPain ? { onClick: onFlagPain } : {})}
      />
    </header>
  );
}

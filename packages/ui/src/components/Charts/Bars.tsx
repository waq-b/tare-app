import type { CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import { num } from '../../lib/format';
import { linear, niceTicks, zeroBased } from '../../lib/scale';
import styles from './Charts.module.css';

const W = 350;

export interface TargetBarsProps {
  bars: readonly { label: string; value: number | null }[];
  /** Target band, drawn dashed. */
  band?: { min: number; max: number };
  label: string;
  unit?: string;
  height?: number;
}

/** Vertical bars from zero, a dashed target band, the latest bar in full lume. */
export function TargetBars({ bars, band, label, unit = '', height = 180 }: TargetBarsProps) {
  const pad = { l: 44, r: 8, t: 10, b: 22 };
  const [, top] = zeroBased(
    bars.map((b) => b.value),
    band ? [band.max] : [],
  );
  const ticks = niceTicks(0, top, 3);
  const y = linear([0, ticks.at(-1) ?? top], [height - pad.b, pad.t]);
  const slot = (W - pad.l - pad.r) / Math.max(1, bars.length);
  const bw = Math.min(28, slot * 0.6);
  const lastWithData = bars.reduce((last, b, i) => (b.value != null ? i : last), -1);
  const filled = bars.filter((b) => b.value != null);
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className={styles['svg']}
      role="img"
      aria-label={`${label}: ${filled.length} of ${bars.length} days with data${band ? `, target ${num(band.min)}–${num(band.max)}${unit ? ` ${unit}` : ''}` : ''}.`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={styles['grid']} />
          <text x={pad.l - 6} y={y(t)} className={styles['yLabel']}>
            {num(t)}
          </text>
        </g>
      ))}
      {band ? (
        <rect
          x={pad.l}
          width={W - pad.l - pad.r}
          y={y(band.max)}
          height={y(band.min) - y(band.max)}
          className={styles['band']}
        />
      ) : null}
      {bars.map((b, i) => {
        const cx0 = pad.l + slot * i + slot / 2;
        return (
          <g key={b.label}>
            {b.value == null ? (
              <rect
                x={cx0 - bw / 2}
                y={pad.t + 4}
                width={bw}
                height={height - pad.b - pad.t - 4}
                rx={4}
                className={styles['noData']}
              />
            ) : (
              <path
                d={`M${cx0 - bw / 2},${y(0)}V${y(b.value) + 4}q0,-4 4,-4h${bw - 8}q4,0 4,4V${y(0)}Z`}
                className={cx(styles['bar'], i === lastWithData && styles['barLatest'])}
              />
            )}
            <text x={cx0} y={height - 6} className={styles['xLabel']} textAnchor="middle">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface TargetBandBarProps {
  /** "Chest" */
  label: string;
  value: number;
  band: { min: number; optimal?: number; max: number };
  /** Right end of the scale (same for every row, so rows compare). */
  scaleMax: number;
}

/** Weekly sets for one muscle against its target band. Status is in words, not only colour. */
export function TargetBandBar({ label, value, band, scaleMax }: TargetBandBarProps) {
  const pct = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
  const status = value < band.min ? 'Below' : value > band.max ? 'Above' : 'In range';
  return (
    <div className={styles['bandRow']}>
      <span className={styles['bandLabel']}>{label}</span>
      <span className={styles['bandTrack']} aria-hidden="true">
        <span
          className={styles['bandZone']}
          style={{ left: pct(band.min), width: `calc(${pct(band.max)} - ${pct(band.min)})` }}
        />
        <span
          className={cx(styles['bandFill'], status === 'In range' && styles['bandIn'])}
          style={{ width: pct(value) }}
        />
      </span>
      <span className={styles['bandValue']}>
        {num(value)}
        <span className="sr-only">
          {' '}
          sets, target {num(band.min)} to {num(band.max)}:
        </span>{' '}
        <span className={styles['bandStatus']}>{status}</span>
      </span>
    </div>
  );
}

export interface MacroBarProps {
  segments: readonly { label: string; grams: number }[];
}

/** Share of energy by macro. Series colours 1–3, always labelled directly. */
export function MacroBar({ segments }: MacroBarProps) {
  const total = segments.reduce((s, x) => s + x.grams, 0) || 1;
  return (
    <div className={styles['macro']}>
      <div className={styles['macroBar']} aria-hidden="true">
        {segments.map((s, i) => (
          <span
            key={s.label}
            style={{ width: `${(s.grams / total) * 100}%`, background: `var(--series-${i + 1})` }}
          />
        ))}
      </div>
      <ul className={styles['macroLabels']}>
        {segments.map((s, i) => (
          <li key={s.label}>
            <span
              className={styles['swatch']}
              style={{ background: `var(--series-${i + 1})` }}
              aria-hidden="true"
            />
            {s.label} <span className={styles['mono']}>{num(s.grams)} g</span>{' '}
            <span className={styles['dim']}>{Math.round((s.grams / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface MeterProps {
  label: string;
  value: number;
  target: number;
  unit: string;
}

/** Progress towards a target, e.g. protein today. */
export function Meter({ label, value, target, unit }: MeterProps) {
  return (
    <div className={styles['meter']}>
      <div className={styles['meterHead']}>
        <span>{label}</span>
        <span>
          <span className={styles['mono']}>{num(value)}</span>
          <span className={styles['dim']}>
            {' '}
            / {num(target)} {unit}
          </span>
        </span>
      </div>
      <meter
        min={0}
        max={target}
        value={Math.min(value, target)}
        className={styles['meterBar']}
        aria-label={`${label}: ${num(value)} of ${num(target)} ${unit}`}
      />
    </div>
  );
}

export interface HeatmapProps {
  /** Weeks, oldest first; each has 7 days (Mon–Sun). Level 0 = rest, 1–3 = shorter to longer. */
  weeks: readonly (readonly (0 | 1 | 2 | 3 | null)[])[];
  label: string;
}

/** Consistency in one hue. `null` = a future day (dashed). */
export function Heatmap({ weeks, label }: HeatmapProps) {
  const days = weeks.flat();
  const trained = days.filter((d) => d != null && d > 0).length;
  return (
    <div
      className={styles['heat']}
      role="img"
      aria-label={`${label}: ${trained} training days in ${weeks.length} weeks.`}
    >
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
        <span key={i} className={styles['heatDay']} aria-hidden="true">
          {d}
        </span>
      ))}
      <div
        className={styles['heatGrid']}
        style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` } as CSSProperties}
        aria-hidden="true"
      >
        {weeks.map((w, wi) =>
          w.map((lvl, di) => (
            <span
              key={`${wi}-${di}`}
              style={{ gridColumn: wi + 1, gridRow: di + 1 }}
              className={cx(styles['cell'], lvl == null ? styles['future'] : styles[`l${lvl}`])}
            />
          )),
        )}
      </div>
    </div>
  );
}

/** Hit / miss / not logged, per day (e.g. protein target). */
export function DayDots({
  days,
  label,
}: {
  days: readonly { letter: string; name: string; state: 'hit' | 'miss' | 'none' }[];
  label: string;
}) {
  const WORD = { hit: 'hit', miss: 'missed', none: 'not logged' } as const;
  return (
    <ol className={styles['dots']} aria-label={label}>
      {days.map((d) => (
        <li key={d.name}>
          <span className={cx(styles['dot'], styles[d.state])} aria-hidden="true" />
          <span className={styles['dotLetter']} aria-hidden="true">
            {d.letter}
          </span>
          <span className="sr-only">
            {d.name}: {WORD[d.state]}
          </span>
        </li>
      ))}
    </ol>
  );
}

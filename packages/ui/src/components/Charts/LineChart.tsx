import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { num } from '../../lib/format';
import { extent, linear, niceTicks } from '../../lib/scale';
import styles from './Charts.module.css';

export interface LinePoint {
  /** Short x label, e.g. "15 Sep". */
  x: string;
  y: number;
  /** Extra line for the tooltip, e.g. "60 × 10 · Hard". */
  detail?: string;
}

export interface LineChartProps {
  points: readonly LinePoint[];
  /** What the numbers are, for the summary and tooltip: "e1RM, kg (estimated)". */
  label: string;
  unit?: string;
  /** `compact`: no axes (cards). `full`: axes, crosshair, scrub and tooltip. */
  variant?: 'compact' | 'full';
  height?: number;
  /** Tap a point, e.g. to open that session. */
  onSelectPoint?: (index: number) => void;
}

const W = 350;

/** One series, one y-axis, lume line with an end marker. Scrub with pointer or arrow keys. */
export function LineChart({
  points,
  label,
  unit = '',
  variant = 'full',
  height,
  onSelectPoint,
}: LineChartProps) {
  const full = variant === 'full';
  const H = height ?? (full ? 200 : 96);
  const pad = full ? { l: 36, r: 12, t: 12, b: 24 } : { l: 4, r: 8, t: 8, b: 8 };
  const [lo, hi] = extent(points.map((p) => p.y));
  const ticks = niceTicks(lo, hi, 3);
  const y = linear([ticks[0] ?? lo, ticks.at(-1) ?? hi], [H - pad.b, pad.t]);
  const x = linear([0, Math.max(1, points.length - 1)], [pad.l, W - pad.r]);
  const [active, setActive] = useState<number | null>(null);
  const tipId = useId();
  const last = points.at(-1);
  const d = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`)
    .join('');
  const summary = last
    ? `${label}: ${points.length} points from ${points[0]?.x} to ${last.x}, latest ${num(last.y)}${unit ? ` ${unit}` : ''}.`
    : `${label}: no data`;

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (points.length - 1));
    setActive(Math.min(points.length - 1, Math.max(0, i)));
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!points.length) return;
    const cur = active ?? points.length - 1;
    if (e.key === 'ArrowLeft') setActive(Math.max(0, cur - 1));
    else if (e.key === 'ArrowRight') setActive(Math.min(points.length - 1, cur + 1));
    else if (e.key === 'Enter' && active != null) onSelectPoint?.(active);
    else if (e.key === 'Escape') setActive(null);
    else return;
    e.preventDefault();
  };
  const a = active != null ? points[active] : undefined;

  return (
    <div className={styles['chartBox']}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles['svg']}
        role="img"
        aria-label={summary}
        {...(full
          ? {
              tabIndex: 0,
              onPointerMove: pick,
              onPointerLeave: () => setActive(null),
              onClick: () => active != null && onSelectPoint?.(active),
              onKeyDown: key,
              'aria-describedby': a ? tipId : undefined,
            }
          : {})}
      >
        {full
          ? ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={styles['grid']} />
                <text x={pad.l - 6} y={y(t)} className={styles['yLabel']}>
                  {num(t)}
                </text>
              </g>
            ))
          : null}
        {full && points.length ? (
          <>
            <text x={pad.l} y={H - 6} className={styles['xLabel']} textAnchor="start">
              {points[0]?.x}
            </text>
            <text x={W - pad.r} y={H - 6} className={styles['xLabel']} textAnchor="end">
              {last?.x}
            </text>
          </>
        ) : null}
        <path d={d} className={styles['line']} />
        {last ? (
          <circle cx={x(points.length - 1)} cy={y(last.y)} r={4} className={styles['end']} />
        ) : null}
        {a && active != null ? (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={pad.t}
              y2={H - pad.b}
              className={styles['cross']}
            />
            <circle cx={x(active)} cy={y(a.y)} r={6} className={styles['ring']} />
          </g>
        ) : null}
      </svg>
      {a ? (
        <ChartTooltip
          id={tipId}
          title={a.x}
          value={`${num(a.y)}${unit ? ` ${unit}` : ''}`}
          {...(a.detail ? { detail: a.detail } : {})}
        />
      ) : null}
      {full ? <p className={styles['hint']}>Drag or use arrow keys to read a point.</p> : null}
    </div>
  );
}

/** The scrub readout: date, value, detail. */
export function ChartTooltip({
  id,
  title,
  value,
  detail,
}: {
  id?: string;
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <div id={id} className={styles['tooltip']} role="status">
      <span className={styles['tipTitle']}>{title}</span>
      <span className={styles['tipValue']}>{value}</span>
      {detail ? <span className={styles['tipDetail']}>{detail}</span> : null}
    </div>
  );
}

/** Raw readings as muted dots, the average as the line (e.g. weigh-ins, 7-day average). */
export function TrendChart({
  raw,
  average,
  label,
  unit = '',
  height = 160,
}: {
  raw: readonly { x: string; y: number }[];
  average: readonly { x: string; y: number }[];
  label: string;
  unit?: string;
  height?: number;
}) {
  const H = height;
  const pad = { l: 36, r: 12, t: 12, b: 24 };
  const [lo, hi] = extent([...raw, ...average].map((p) => p.y));
  const ticks = niceTicks(lo, hi, 3);
  const y = linear([ticks[0] ?? lo, ticks.at(-1) ?? hi], [H - pad.b, pad.t]);
  const xs = [...new Set([...raw, ...average].map((p) => p.x))];
  const x = (label: string) =>
    linear([0, Math.max(1, xs.length - 1)], [pad.l, W - pad.r])(xs.indexOf(label));
  const d = average
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`)
    .join('');
  const last = average.at(-1);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles['svg']}
      role="img"
      aria-label={`${label}: ${raw.length} readings${last ? `, average now ${num(last.y)}${unit ? ` ${unit}` : ''}` : ''}.`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={styles['grid']} />
          <text x={pad.l - 6} y={y(t)} className={styles['yLabel']}>
            {num(t)}
          </text>
        </g>
      ))}
      {raw.map((p, i) => (
        <circle key={i} cx={x(p.x)} cy={y(p.y)} r={2.5} className={styles['rawDot']} />
      ))}
      <path d={d} className={styles['line']} />
      {last ? <circle cx={x(last.x)} cy={y(last.y)} r={4} className={styles['end']} /> : null}
    </svg>
  );
}

/** A tiny line for table cells. Decorative: the table holds the numbers. */
export function Sparkline({ values }: { values: readonly number[] }) {
  const w = 52;
  const h = 20;
  const [lo, hi] = extent(values);
  const y = linear([lo, hi], [h - 3, 3]);
  const x = linear([0, Math.max(1, values.length - 1)], [2, w - 4]);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const last = values.at(-1);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className={styles['spark']}
    >
      <path d={d} className={styles['sparkLine']} />
      {last != null ? (
        <circle cx={x(values.length - 1)} cy={y(last)} r={2} className={styles['end']} />
      ) : null}
    </svg>
  );
}

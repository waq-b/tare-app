// Number formatting shared by workout components. UK style, kg by default.

export type LoadConvention =
  'total' | 'per_hand' | 'per_side' | 'bodyweight' | 'bodyweight_plus' | 'assisted' | (string & {});

/** 72.5 → "72.5", 70 → "70". */
export function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** Words after a load, from vpt `load_convention`: "per hand", "per side", or none. */
export function conventionSuffix(c: LoadConvention | undefined): string {
  if (c === 'per_hand') return 'per hand';
  if (c === 'per_side') return 'per side';
  return '';
}

/** The load as shown in prescriptions: "70", "BW", "BW + 10". */
export function loadText(load: number | null, c?: LoadConvention): string {
  if (c === 'bodyweight' || load == null) return 'BW';
  if (c === 'bodyweight_plus') return `BW + ${num(load)}`;
  if (c === 'assisted') return `−${num(load)}`;
  return num(load);
}

/** "3 × 8 @ 70", or "3 × 15" for bodyweight. */
export function rxText(
  sets: number,
  reps: number | string,
  load: number | null,
  c?: LoadConvention,
): string {
  const base = `${sets} × ${reps}`;
  return c === 'bodyweight' || load == null ? base : `${base} @ ${loadText(load, c)}`;
}

/** Seconds → "1:32". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Seconds → "1 minute 32 seconds", for screen readers. */
export function clockWords(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const parts = [
    m ? `${m} minute${m === 1 ? '' : 's'}` : '',
    r ? `${r} second${r === 1 ? '' : 's'}` : '',
  ];
  return parts.filter(Boolean).join(' ') || '0 seconds';
}

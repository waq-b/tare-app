import type { AppData } from '../data/DbContext.tsx';
import { isoDay } from '../lib/dates.ts';

/** A weigh-in now (the phone's date and time). */
export function saveWeighIn(data: AppData, kg: number, waistCm: number | null, now = new Date()) {
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return data.r.weighIns.add({ date: isoDay(now), time, kg, waistCm });
}

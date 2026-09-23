import type { AppData } from '../data/DbContext.tsx';
import { isoDay } from '../lib/dates.ts';

const num = (t: string) => {
  const n = Number(t.replace(',', '.'));
  return t.trim() && Number.isFinite(n) && n > 0 ? n : null;
};

/** Saves body stats to the profile; a changed weight is also logged as a weigh-in now. */
export async function saveBody(
  data: AppData,
  input: {
    sex: 'male' | 'female' | 'prefer_not_to_say' | null;
    age: string;
    heightCm: string;
    bodyweight: string;
  },
  lastWeight: number | null,
  now = new Date(),
) {
  const age = num(input.age);
  await data.r.profile.update({
    sex: input.sex,
    birthYear: age ? now.getFullYear() - Math.round(age) : null,
    heightCm: num(input.heightCm),
  });
  const kg = num(input.bodyweight);
  if (kg && kg !== lastWeight) {
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await data.r.weighIns.add({ date: isoDay(now), time, kg, waistCm: null });
  }
}

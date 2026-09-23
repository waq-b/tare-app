// The app's slim dataset: every rules file in full, plus only the exercises the app needs
// (staples and every swap they offer). Pure: raw files in, raw files out. The result goes
// through loadVpt like the full set, so it's validated by the same schemas and version check.
import type { RawVpt } from './load.ts';

type Obj = Record<string, unknown>;
interface RawExercise extends Obj {
  id: string;
  staple: boolean;
  swaps: { id: string }[];
}

/** Fields the app never reads (provenance lives in the full set and its README). */
const DROP = new Set(['sources', 'licence', 'derived']);

export function slimForApp(raw: RawVpt): RawVpt {
  const file = raw.exercises as Obj & {
    exercises: RawExercise[];
    body_area_map: Obj & { areas: Record<string, { primary: string[]; secondary: string[] }> };
  };
  const staples = file.exercises.filter((e) => e.staple);
  const keep = new Set([
    ...staples.map((e) => e.id),
    ...staples.flatMap((e) => e.swaps.map((s) => s.id)),
  ]);

  const exercises = file.exercises
    .filter((e) => keep.has(e.id))
    .map((e) => {
      const out: Obj = {};
      for (const [k, v] of Object.entries(e)) if (!DROP.has(k)) out[k] = v;
      // A swap target's own swaps can point outside the set: keep only those we ship.
      out['swaps'] = e.swaps.filter((s) => keep.has(s.id));
      return out;
    });

  const areas = Object.fromEntries(
    Object.entries(file.body_area_map.areas).map(([area, a]) => [
      area,
      {
        primary: a.primary.filter((id) => keep.has(id)),
        secondary: a.secondary.filter((id) => keep.has(id)),
      },
    ]),
  );

  return {
    ...raw,
    exercises: {
      ...file,
      count: exercises.length,
      slim: 'tare app bundle: staples + their swaps',
      body_area_map: { ...file.body_area_map, areas },
      exercises,
    },
  };
}

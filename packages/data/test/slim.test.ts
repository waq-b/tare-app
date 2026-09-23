import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { raw as appRaw } from '../src/source-app.ts';
import { loadVpt, slimForApp } from '../src/index.ts';
import { raw } from '../src/source-full.ts';

const full = loadVpt(raw);
const slimRaw = slimForApp(raw);
const slim = loadVpt(slimRaw);
const ids = new Set(slim.exercises.map((e) => e.id));

describe('app bundle (slimForApp)', () => {
  it('passes the same schemas and version check as the full set', () => {
    expect(slim.version).toBe(full.version);
    expect(slim.rules.size).toBe(full.rules.size);
    expect(slim.safety).toEqual(full.safety);
  });

  it('ships every staple and every swap resolves', () => {
    for (const e of full.exercises.filter((x) => x.staple)) {
      expect(ids.has(e.id), e.id).toBe(true);
      for (const s of e.swaps) expect(ids.has(s.id), `${e.id} → ${s.id}`).toBe(true);
    }
    for (const e of slim.exercises) {
      for (const s of e.swaps) expect(ids.has(s.id), `${e.id} → ${s.id}`).toBe(true);
    }
  });

  it('keeps staples’ swaps whole, and every other field the app reads', () => {
    for (const e of slim.exercises.filter((x) => x.staple)) {
      const f = full.exercises.find((x) => x.id === e.id)!;
      expect(e.swaps).toEqual(f.swaps);
      expect(e.cues).toEqual(f.cues);
      expect(e.body_areas).toEqual(f.body_areas);
    }
  });

  it('body_area_map only lists shipped exercises, and drops none of them', () => {
    for (const [area, a] of Object.entries(slim.bodyAreaMap)) {
      const f = full.bodyAreaMap[area]!;
      expect(a.primary).toEqual(f.primary.filter((id) => ids.has(id)));
      expect(a.secondary).toEqual(f.secondary.filter((id) => ids.has(id)));
    }
  });

  it('stays under 300 KB gzipped', () => {
    expect(gzipSync(JSON.stringify(slimRaw)).length).toBeLessThan(300 * 1024);
  });

  it('dist/vpt-app.json is up to date (run `npm run build -w @tare/data`)', () => {
    expect(appRaw).toEqual(JSON.parse(JSON.stringify(slimRaw)));
  });
});

import { describe, expect, it } from 'vitest';
import { generate, type TokenSource } from '../src/generate.ts';
import { loadSource } from './helpers.ts';

const src = loadSource();

describe('generate', () => {
  const out = generate(src);

  it('CSS matches snapshot', () => {
    expect(out.css).toMatchSnapshot();
  });

  it('TS declarations match snapshot', () => {
    expect(out.dts).toMatchSnapshot();
  });

  it('dark is the default (:root) theme and light overrides colours', () => {
    expect(out.css).toMatch(
      /:root,\n\[data-theme="dark"\] \{\n {2}color-scheme: dark;\n {2}--bg: #0E0F14;/,
    );
    expect(out.css).toMatch(
      /\[data-theme="light"\] \{\n {2}color-scheme: light;\n {2}--bg: #F3F2ED;/,
    );
  });

  it('every safety_rules.json action has a safety token', async () => {
    const { readFileSync } = await import('node:fs');
    const rules = JSON.parse(
      readFileSync(new URL('../../../vpt/data/safety_rules.json', import.meta.url), 'utf8'),
    ) as { rules: { action: string }[] };
    const actions = new Set(rules.rules.map((r) => r.action));
    expect(new Set(Object.keys(src.safety).filter((k) => !k.startsWith('$')))).toEqual(actions);
  });

  it('reduced motion collapses durations and press scale', () => {
    const reduced = out.css.slice(out.css.indexOf('@media (prefers-reduced-motion'));
    expect(reduced).toContain('--motion-sheet-duration: 120ms;');
    expect(reduced).toContain('--motion-press-scale: 1;');
    expect(reduced).not.toMatch(/duration: (90|160|220|280)ms/);
  });
});

describe('validate', () => {
  const clone = (): TokenSource => structuredClone(src);

  it('rejects themes with different keys', () => {
    const s = clone();
    delete s.color.light['hold'];
    expect(() => generate(s)).toThrow(/Only dark: \[hold\]/);
  });

  it('rejects lowercase or malformed hex', () => {
    const s = clone();
    s.color.dark['bg'] = { $value: '#0e0f14' };
    expect(() => generate(s)).toThrow(/color\.dark\.bg/);
  });

  it('rejects safety mapped to an unknown colour', () => {
    const s = clone();
    s.safety['stop_and_see_gp'] = { color: 'amber', emphasis: 'fill' };
    expect(() => generate(s)).toThrow(/unknown colour "amber"/);
  });
});

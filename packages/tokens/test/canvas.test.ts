// The Tokens and Charts boards are the spec. Every swatch they show must match tokens.json.
import { describe, expect, it } from 'vitest';
import { boardText, loadSource } from './helpers.ts';

const src = loadSource();

function swatches(text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const m of text.matchAll(/--([a-z0-9-]+) (?:\||·) (#[0-9A-Fa-f]{6})/g)) {
    found.set(m[1] as string, (m[2] as string).toUpperCase());
  }
  for (const m of text.matchAll(/(series-\d) (#[0-9A-Fa-f]{6})/g)) {
    found.set(m[1] as string, (m[2] as string).toUpperCase());
  }
  return found;
}

function byTheme(board: string): { dark: Map<string, string>; light: Map<string, string> } {
  const [dark, light] = boardText(board).split(' | Light | ');
  if (!dark || !light) throw new Error(`${board}: no "Light" section found`);
  return { dark: swatches(dark), light: swatches(light) };
}

describe.each(['Tokens.dc.html', 'Charts.dc.html'])('%s', (board) => {
  const themes = byTheme(board);

  it.each(['dark', 'light'] as const)('%s swatches match tokens.json', (theme) => {
    const found = themes[theme];
    expect(found.size).toBeGreaterThanOrEqual(3);
    for (const [name, hex] of found) {
      expect(src.color[theme][name]?.$value, `${theme} --${name}`).toBe(hex);
    }
  });
});

it('the Tokens board shows all 17 base + semantic colours per theme', () => {
  expect(byTheme('Tokens.dc.html').dark.size).toBe(17);
  expect(byTheme('Tokens.dc.html').light.size).toBe(17);
});

it('type sizes and weights match the Tokens board', () => {
  const text = boardText('Tokens.dc.html');
  for (const m of text.matchAll(/type\.([a-z-]+) \| [^|]+ \| (\d+)px \/ (\d+)/g)) {
    const style = src.type[m[1] as string];
    expect(style, `type.${m[1]}`).toBeDefined();
    expect(style?.size).toBe(Number(m[2]));
    expect(style?.weight).toBe(Number(m[3]));
  }
});

it('spacing and radius match the Tokens board', () => {
  const text = boardText('Tokens.dc.html');
  for (const m of text.matchAll(/space\.(\d) \| (\d+)px/g)) {
    expect(src.space[m[1] as string]?.$value).toBe(Number(m[2]));
  }
  for (const m of text.matchAll(/radius\.([a-z]+) \| (\d+)/g)) {
    expect(src.radius[m[1] as string]?.$value).toBe(Number(m[2]));
  }
});

it('motion durations match the Tokens board', () => {
  const text = boardText('Tokens.dc.html');
  const motion = src.motion as unknown as Record<string, { duration?: number }>;
  for (const m of text.matchAll(/motion\.([a-z-]+) \| (\d+) ms/g)) {
    expect(motion[m[1] as string]?.duration, `motion.${m[1]}`).toBe(Number(m[2]));
  }
});

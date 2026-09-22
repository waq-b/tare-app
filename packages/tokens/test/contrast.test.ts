// WCAG contrast for both themes. Failures that come from the canvas itself are not
// silently re-tinted: they're listed in EXCEPTIONS (and docs/DESIGN.md) for Waqar.
import { describe, expect, it } from 'vitest';
import { contrast, loadSource, mix } from './helpers.ts';

const src = loadSource();
const TEXT = 4.5;
const NON_TEXT = 3;

/** `${theme}:${fg} on ${bg}` → reason. Keep in sync with DESIGN.md → Known contrast exceptions.
 * `<c>-tint/<ground>` means the colour's 12% tint laid over that ground (chips, tags, banners). */
const EXCEPTIONS: Record<string, string> = {
  'dark:text-3 on surface-3': '4.23:1. Avoid text-3 on surface-3; use text-2 there',
  'light:text-3 on surface-3': '4.26:1. Avoid text-3 on surface-3; use text-2 there',
  'light:series-2 on bg': '2.85:1. Chart marks are always direct-labelled (Charts rule 02)',
  'light:series-3 on bg': '2.51:1. Canvas already notes light aqua < 3:1; always labelled',
  'light:progress on progress-tint/bg':
    '4.08:1. Chip text on a tint straight on bg; open decision #24',
  'light:swap on swap-tint/bg': '4.33:1. as above',
  'light:warning on warning-tint/bg': '4.39:1. as above',
  'light:safety-stop on safety-stop-tint/bg': '4.16:1. as above',
};

type Theme = 'dark' | 'light';
const base = (theme: Theme, name: string): string => {
  const v = src.color[theme][name]?.$value;
  if (!v?.startsWith('#')) throw new Error(`${theme}.${name} is not a hex colour`);
  return v;
};
/** A token, or `<c>-tint/<ground>`: the colour's tint composited over a ground. */
const hex = (theme: Theme, name: string): string => {
  const m = /^(.+)-tint\/(.+)$/.exec(name);
  if (!m) return base(theme, name);
  const pct = (src.tint.steps['tint']?.$value ?? 0) / 100;
  return mix(base(theme, m[1] as string), base(theme, m[2] as string), pct);
};

function check(theme: Theme, fg: string, bg: string, min: number) {
  const key = `${theme}:${fg} on ${bg}`;
  const ratio = contrast(hex(theme, fg), hex(theme, bg));
  if (ratio < min && key in EXCEPTIONS) return;
  expect(ratio, `${key} = ${ratio.toFixed(2)}:1, needs ${min}:1`).toBeGreaterThanOrEqual(min);
}

const grounds = ['bg', 'surface-1', 'surface-2', 'surface-3'];
const semantic = ['progress', 'hold', 'deload', 'swap', 'warning', 'safety-stop', 'accent'];

describe.each(['dark', 'light'] as const)('%s', (theme) => {
  it.each(['text', 'text-2', 'text-3'])('%s is readable on every surface', (fg) => {
    for (const bg of grounds) check(theme, fg, bg, TEXT);
  });

  it('on-accent is readable on accent', () => check(theme, 'on-accent', 'accent', TEXT));

  it('white is readable on the 999 screen', () =>
    check(theme, 'on-safety-stop-solid', 'safety-stop-solid', TEXT));

  it.each(semantic)('%s works as text on bg and surface-1', (fg) => {
    // The canvas uses every semantic colour for chip and heading text.
    for (const bg of ['bg', 'surface-1']) check(theme, fg, bg, TEXT);
  });

  it.each(semantic)('%s works as text on its own tint (chips, tags, banners)', (fg) => {
    for (const ground of ['bg', 'surface-1']) check(theme, fg, `${fg}-tint/${ground}`, TEXT);
  });

  it.each(['series-1', 'series-2', 'series-3'])('%s is visible as a mark on bg', (fg) => {
    check(theme, fg, 'bg', NON_TEXT);
  });
});

it('touch minimum is at least 44px', () => {
  expect(src.touch['min']?.$value).toBeGreaterThanOrEqual(44);
});

it('every exception is still needed', () => {
  for (const key of Object.keys(EXCEPTIONS)) {
    const [theme, pair] = key.split(':') as [Theme, string];
    const [fg, bg] = pair.split(' on ') as [string, string];
    const min = fg.startsWith('series-') ? NON_TEXT : TEXT;
    expect(contrast(hex(theme, fg), hex(theme, bg)), key).toBeLessThan(min);
  }
});

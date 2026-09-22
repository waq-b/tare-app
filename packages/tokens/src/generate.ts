// Turns tokens.json into CSS custom properties and typed TS exports.
// Pure: takes the parsed source, returns file contents. scripts/build.ts writes them.

interface Leaf<T> {
  $value: T;
  $description?: string;
}

interface TypeStyle {
  family: 'sans' | 'mono' | 'pixel';
  size: number;
  weight: number;
  line: number;
  tracking: string;
  numeric?: boolean;
  uppercase?: boolean;
}

interface MotionStep {
  duration: number;
  easing: string;
}

export interface TokenSource {
  color: { dark: Record<string, Leaf<string>>; light: Record<string, Leaf<string>> };
  tint: { steps: Record<string, Leaf<number>>; colors: string[] };
  muscle: { 'secondary-opacity': Leaf<number> };
  brand: Record<string, Leaf<string>>;
  safety: Record<string, { color: string; emphasis: 'solid' | 'fill' | 'accent' }>;
  font: Record<string, Leaf<string[]>>;
  type: Record<string, TypeStyle>;
  space: Record<string, Leaf<number>>;
  radius: Record<string, Leaf<number>>;
  touch: Record<string, Leaf<number>>;
  elevation: Record<string, { surface: string; border: string; shadow: string }>;
  motion: Record<string, MotionStep | Leaf<number>> & { reduced: MotionStep };
}

export interface GeneratedFiles {
  css: string;
  js: string;
  dts: string;
}

const HEX = /^#[0-9A-F]{6}$/;
const RGBA = /^rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0|1|0?\.\d+)\)$/;

/** Keys starting with `$` are metadata, not tokens. */
function entries<T>(group: Record<string, T>): [string, T][] {
  return Object.entries(group).filter(([k]) => !k.startsWith('$'));
}

function isMotionStep(v: MotionStep | Leaf<number>): v is MotionStep {
  return 'duration' in v;
}

function fontStack(families: string[]): string {
  const generic = new Set(['sans-serif', 'serif', 'monospace', 'ui-monospace']);
  return families.map((f) => (generic.has(f) ? f : `'${f}'`)).join(', ');
}

export function validate(src: TokenSource): void {
  const dark = entries(src.color.dark).map(([k]) => k);
  const light = entries(src.color.light).map(([k]) => k);
  const onlyDark = dark.filter((k) => !light.includes(k));
  const onlyLight = light.filter((k) => !dark.includes(k));
  if (onlyDark.length || onlyLight.length) {
    throw new Error(
      `Theme keys differ. Only dark: [${onlyDark.join(', ')}]. Only light: [${onlyLight.join(', ')}]`,
    );
  }
  for (const theme of ['dark', 'light'] as const) {
    for (const [k, v] of entries(src.color[theme])) {
      if (!HEX.test(v.$value) && !RGBA.test(v.$value)) {
        throw new Error(`color.${theme}.${k}: "${v.$value}" is not #RRGGBB (uppercase) or rgba()`);
      }
    }
  }
  for (const c of src.tint.colors) {
    if (!dark.includes(c)) throw new Error(`tint.colors: unknown colour "${c}"`);
  }
  for (const [action, s] of entries(src.safety)) {
    if (!dark.includes(s.color)) throw new Error(`safety.${action}: unknown colour "${s.color}"`);
  }
  for (const [level, e] of entries(src.elevation)) {
    for (const ref of [e.surface, e.border]) {
      if (!dark.includes(ref)) throw new Error(`elevation.${level}: unknown colour "${ref}"`);
    }
  }
}

function colorBlock(src: TokenSource, theme: 'dark' | 'light'): string[] {
  return entries(src.color[theme]).map(([k, v]) => `  --${k}: ${v.$value};`);
}

/** Declarations that reference themed colours. Repeated in every theme scope so they
 * resolve against the nearest theme, e.g. a light story inside a dark page. */
function derivedBlock(src: TokenSource): string[] {
  const out: string[] = [];
  for (const c of src.tint.colors) {
    for (const [step, pct] of entries(src.tint.steps)) {
      out.push(`  --${c}-${step}: color-mix(in srgb, var(--${c}) ${pct.$value}%, transparent);`);
    }
  }
  const secondary = src.muscle['secondary-opacity'].$value;
  out.push(`  --muscle-primary: var(--accent);`);
  out.push(`  --muscle-secondary: color-mix(in srgb, var(--accent) ${secondary}%, transparent);`);
  for (const [level, e] of entries(src.elevation)) {
    out.push(`  --elev-${level}-surface: var(--${e.surface});`);
    out.push(`  --elev-${level}-border: var(--${e.border});`);
    out.push(
      `  --elev-${level}-shadow: ${e.shadow === 'none' ? 'none' : `${e.shadow} var(--shadow)`};`,
    );
  }
  for (const [action, s] of entries(src.safety)) {
    const name = action.replaceAll('_', '-');
    out.push(`  --safety-${name}: var(--${s.color});`);
  }
  return out;
}

function staticBlock(src: TokenSource): string[] {
  const out: string[] = [];
  for (const [k, v] of entries(src.brand)) out.push(`  --brand-${k}: ${v.$value};`);
  for (const [k, v] of entries(src.font)) out.push(`  --font-${k}: ${fontStack(v.$value)};`);
  for (const [k, t] of entries(src.type)) {
    out.push(`  --type-${k}-family: var(--font-${t.family});`);
    out.push(`  --type-${k}-size: ${t.size}px;`);
    out.push(`  --type-${k}-weight: ${t.weight};`);
    out.push(`  --type-${k}-line: ${t.line};`);
    out.push(`  --type-${k}-tracking: ${t.tracking};`);
    out.push(`  --type-${k}-numeric: ${t.numeric ? 'tabular-nums' : 'normal'};`);
    out.push(`  --type-${k}-transform: ${t.uppercase ? 'uppercase' : 'none'};`);
  }
  for (const [k, v] of entries(src.space)) out.push(`  --space-${k}: ${v.$value}px;`);
  for (const [k, v] of entries(src.radius)) out.push(`  --radius-${k}: ${v.$value}px;`);
  for (const [k, v] of entries(src.touch)) out.push(`  --touch-${k}: ${v.$value}px;`);
  out.push(...motionBlock(src, false));
  return out;
}

function motionBlock(src: TokenSource, reduced: boolean): string[] {
  const out: string[] = [];
  for (const [k, v] of entries(src.motion)) {
    if (k === 'reduced') continue;
    if (isMotionStep(v)) {
      const step = reduced ? src.motion.reduced : v;
      out.push(`  --motion-${k}-duration: ${step.duration}ms;`);
      out.push(`  --motion-${k}-easing: ${step.easing};`);
    } else {
      out.push(`  --motion-${k}: ${reduced && k === 'press-scale' ? 1 : v.$value};`);
    }
  }
  return out;
}

export function cssVarNames(src: TokenSource): string[] {
  const css = generateCss(src);
  return [...new Set([...css.matchAll(/^\s+--([a-z0-9-]+):/gm)].map((m) => m[1] as string))];
}

function generateCss(src: TokenSource): string {
  return [
    '/* Generated from packages/tokens/src/tokens.json. Do not edit. */',
    '',
    '/* Dark is the default theme. */',
    ':root,',
    '[data-theme="dark"] {',
    '  color-scheme: dark;',
    ...colorBlock(src, 'dark'),
    ...derivedBlock(src),
    '}',
    '',
    '[data-theme="light"] {',
    '  color-scheme: light;',
    ...colorBlock(src, 'light'),
    ...derivedBlock(src),
    '}',
    '',
    ':root {',
    ...staticBlock(src),
    '}',
    '',
    '@media (prefers-reduced-motion: reduce) {',
    '  :root {',
    ...motionBlock(src, true).map((l) => `  ${l}`),
    '  }',
    '}',
    '',
  ].join('\n');
}

/** Strips `$description` etc. so the runtime object holds values only. */
function values(src: TokenSource) {
  const theme = (t: 'dark' | 'light') =>
    Object.fromEntries(entries(src.color[t]).map(([k, v]) => [k, v.$value]));
  const flat = (g: Record<string, Leaf<number>>) =>
    Object.fromEntries(entries(g).map(([k, v]) => [k, v.$value]));
  return {
    color: { dark: theme('dark'), light: theme('light') },
    brand: Object.fromEntries(entries(src.brand).map(([k, v]) => [k, v.$value])),
    safety: Object.fromEntries(
      entries(src.safety).map(([k, v]) => [k, { color: v.color, emphasis: v.emphasis }]),
    ),
    font: Object.fromEntries(entries(src.font).map(([k, v]) => [k, fontStack(v.$value)])),
    type: Object.fromEntries(
      entries(src.type).map(([k, t]) => [
        k,
        {
          family: t.family,
          size: t.size,
          weight: t.weight,
          line: t.line,
          tracking: t.tracking,
          numeric: t.numeric ?? false,
          uppercase: t.uppercase ?? false,
        },
      ]),
    ),
    space: flat(src.space),
    radius: flat(src.radius),
    touch: flat(src.touch),
    motion: Object.fromEntries(
      entries(src.motion).map(([k, v]) => [
        k,
        isMotionStep(v) ? { duration: v.duration, easing: v.easing } : v.$value,
      ]),
    ),
    tint: {
      ...Object.fromEntries(entries(src.tint.steps).map(([k, v]) => [k, v.$value])),
    },
    muscleSecondaryOpacity: src.muscle['secondary-opacity'].$value,
  };
}

function union(items: string[]): string {
  return items.map((i) => `'${i}'`).join(' | ');
}

export function generate(src: TokenSource): GeneratedFiles {
  validate(src);
  const v = values(src);
  const names = cssVarNames(src);
  const json = JSON.stringify(v, null, 2);

  const js = [
    '// Generated from packages/tokens/src/tokens.json. Do not edit.',
    `export const tokens = ${json};`,
    '',
    `export const themes = ['dark', 'light'];`,
    `export const defaultTheme = 'dark';`,
    `export const safetyActions = ${JSON.stringify(Object.keys(v.safety))};`,
    `export const cssVarNames = ${JSON.stringify(names)};`,
    '',
    '/** `var(--name)` for a known token. */',
    'export function cssVar(name) {',
    '  return `var(--${name})`;',
    '}',
    '',
  ].join('\n');

  const dts = [
    '// Generated from packages/tokens/src/tokens.json. Do not edit.',
    `export declare const tokens: ${json.replace(/^(\s*)"([^"]+)":/gm, "$1readonly '$2':")};`,
    '',
    `export type ThemeName = 'dark' | 'light';`,
    `export declare const themes: readonly ThemeName[];`,
    `export declare const defaultTheme: 'dark';`,
    `export type ColorName = ${union(Object.keys(v.color.dark))};`,
    `export type SemanticColor = 'progress' | 'hold' | 'deload' | 'swap' | 'warning' | 'safety-stop';`,
    `export type SafetyAction = ${union(Object.keys(v.safety))};`,
    `export type SafetyEmphasis = 'solid' | 'fill' | 'accent';`,
    `export declare const safetyActions: readonly SafetyAction[];`,
    `export type TypeStyleName = ${union(Object.keys(v.type))};`,
    `export type SpaceStep = ${union(Object.keys(v.space))};`,
    `export type RadiusName = ${union(Object.keys(v.radius))};`,
    `export type CssVarName =\n${names.map((n) => `  | '${n}'`).join('\n')};`,
    `export declare const cssVarNames: readonly CssVarName[];`,
    '',
    '/** `var(--name)` for a known token. */',
    'export declare function cssVar(name: CssVarName): string;',
    '',
  ].join('\n');

  return { css: generateCss(src), js, dts };
}

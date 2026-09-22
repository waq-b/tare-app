// Throwaway D0 sign-off page: tokens + icons in both themes, before Storybook exists.
//   npm run build && npm run gallery -w @tare/icons   → packages/icons/gallery/index.html
// Self-contained (fonts and CSS inlined), so it can be opened on a phone.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { tokens } from '@tare/tokens';
import {
  Icon,
  iconNames,
  movementPatterns,
  MuscleMap,
  PatternIcon,
  patternsWithoutGlyph,
  type Muscle,
} from '../src/index.ts';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const font = (family: string, file: string, weight: number) => {
  const path = require.resolve(`@fontsource/${file.split('-latin')[0]}/files/${file}`);
  const data = readFileSync(path).toString('base64');
  return `@font-face{font-family:'${family}';font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${data}) format('woff2')}`;
};
const fonts = [
  font('Instrument Sans', 'instrument-sans-latin-400-normal.woff2', 400),
  font('Instrument Sans', 'instrument-sans-latin-600-normal.woff2', 600),
  font('Azeret Mono', 'azeret-mono-latin-500-normal.woff2', 500),
  font('Azeret Mono', 'azeret-mono-latin-600-normal.woff2', 600),
  font('Silkscreen', 'silkscreen-latin-400-normal.woff2', 400),
].join('\n');
const tokensCss = readFileSync(require.resolve('@tare/tokens/tokens.css'), 'utf8');

const colorNames = Object.keys(tokens.color.dark);
const lifts: { name: string; primary: Muscle[]; secondary: Muscle[] }[] = [
  {
    name: 'Squat',
    primary: ['quadriceps', 'glutes'],
    secondary: ['abdominals', 'lower back', 'hamstrings'],
  },
  { name: 'Bench press', primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  {
    name: 'Lat pulldown',
    primary: ['lats'],
    secondary: ['biceps', 'forearms', 'shoulders', 'middle back'],
  },
  {
    name: 'Deadlift',
    primary: ['lower back', 'glutes', 'hamstrings'],
    secondary: ['traps', 'lats', 'forearms', 'quadriceps'],
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label">{title}</h2>
      {children}
    </section>
  );
}

function Theme({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div className="theme" data-theme={theme}>
      <h1 className="title">{theme === 'dark' ? 'Dark · default' : 'Light'}</h1>

      <Section title="Colour">
        <div className="swatches">
          {colorNames.map((c) => (
            <div key={c} className="swatch">
              <span className="chip" style={{ background: `var(--${c})` }} />
              <code>--{c}</code>
              <code className="dim">
                {tokens.color[theme][c as keyof typeof tokens.color.dark]}
              </code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tints (fill / edge)">
        <div className="tints">
          {['accent', 'progress', 'hold', 'deload', 'swap', 'warning', 'safety-stop'].map((c) => (
            <span
              key={c}
              className="pill"
              style={{
                background: `var(--${c}-tint)`,
                borderColor: `var(--${c}-edge)`,
                color: `var(--${c})`,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Safety levels (colour + emphasis only; words come from safety_rules.json)">
        <div className="safety">
          {Object.entries(tokens.safety).map(([action, s]) => (
            <div
              key={action}
              className={`safety-card ${s.emphasis}`}
              style={{ '--c': `var(--${s.color})` } as React.CSSProperties}
            >
              <Icon name={s.emphasis === 'solid' ? 'phone' : 'alert'} size={20} />
              <code>{action}</code>
              <span className="dim">{s.emphasis}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        {Object.entries(tokens.type).map(([name, t]) => (
          <div key={name} className="type-row">
            <code className="dim">{name}</code>
            <span
              style={{
                fontFamily: `var(--type-${name}-family)`,
                fontSize: `var(--type-${name}-size)`,
                fontWeight: `var(--type-${name}-weight)`,
                lineHeight: `var(--type-${name}-line)`,
                letterSpacing: `var(--type-${name}-tracking)`,
                fontVariantNumeric: `var(--type-${name}-numeric)`,
                textTransform:
                  `var(--type-${name}-transform)` as React.CSSProperties['textTransform'],
              }}
            >
              {t.family === 'mono'
                ? '72.5 × 8'
                : name === 'label'
                  ? 'Last time'
                  : 'Nothing changes until you accept it.'}
            </span>
          </div>
        ))}
      </Section>

      <Section title="Space · radius">
        <div className="row">
          {Object.entries(tokens.space).map(([k, v]) => (
            <div key={k} className="space">
              <span style={{ width: v, height: v }} />
              <code className="dim">{k}</code>
            </div>
          ))}
        </div>
        <div className="row">
          {Object.keys(tokens.radius).map((k) => (
            <div key={k} className="radius" style={{ borderRadius: `var(--radius-${k})` }}>
              <code>{k}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Elevation">
        <div className="row">
          {[0, 1, 2].map((l) => (
            <div
              key={l}
              className="elev"
              style={{
                background: `var(--elev-${l}-surface)`,
                borderColor: `var(--elev-${l}-border)`,
                boxShadow: `var(--elev-${l}-shadow)`,
              }}
            >
              elev.{l}
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Interface icons (${iconNames.length})`}>
        <div className="icons">
          {iconNames.map((n) => (
            <div key={n} className="icon">
              <Icon name={n} size={26} />
              <code className="dim">{n}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Movement patterns (vpt enum; * = no canvas drawing yet)">
        <div className="icons">
          {movementPatterns.map((p) => (
            <div key={p} className="icon">
              <PatternIcon pattern={p} size={36} />
              <code className="dim">
                {p}
                {(patternsWithoutGlyph as readonly string[]).includes(p) ? ' *' : ''}
              </code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Muscle map (primary / secondary at 40%)">
        <div className="row">
          {lifts.map((l) => (
            <figure key={l.name} className="lift">
              <div className="row tight">
                <MuscleMap view="front" primary={l.primary} secondary={l.secondary} width={52} />
                <MuscleMap view="back" primary={l.primary} secondary={l.secondary} width={52} />
              </div>
              <figcaption>{l.name}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <p className="tag">
        <span className="pip" /> a miniquest
      </p>
    </div>
  );
}

const css = `
${fonts}
${tokensCss}
*{box-sizing:border-box}
body{margin:0;background:#000;font-family:var(--font-sans)}
.themes{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr))}
.theme{background:var(--bg);color:var(--text);padding:var(--space-6) var(--space-4);font-size:var(--type-body-size);line-height:var(--type-body-line)}
.title{font-size:var(--type-title-size);font-weight:var(--type-title-weight);margin:0 0 var(--space-4)}
.label{font-size:var(--type-label-size);font-weight:var(--type-label-weight);letter-spacing:var(--type-label-tracking);text-transform:uppercase;color:var(--text-3);margin:var(--space-7) 0 var(--space-3)}
code{font-family:var(--font-mono);font-size:12px}
.dim{color:var(--text-3)}
.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:var(--space-3)}
.swatch{display:flex;flex-direction:column;gap:2px}
.chip{height:44px;border-radius:var(--radius-md);border:1px solid var(--line)}
.tints,.row{display:flex;flex-wrap:wrap;gap:var(--space-3);align-items:flex-end}
.row.tight{gap:var(--space-2)}
.pill{padding:6px 12px;border-radius:var(--radius-pill);border:1px solid;font-size:var(--type-body-s-size);font-weight:600}
.safety{display:grid;gap:var(--space-2)}
.safety-card{display:flex;gap:var(--space-3);align-items:center;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);border:1px solid var(--line);background:var(--surface-1)}
.safety-card svg{color:var(--c)}
.safety-card.fill{background:color-mix(in srgb,var(--c) 12%,transparent);border-color:color-mix(in srgb,var(--c) 40%,transparent)}
.safety-card.fill code{color:var(--c)}
.safety-card.accent{border-left:4px solid var(--c)}
.safety-card.solid{background:var(--safety-stop-solid);color:var(--on-safety-stop-solid);border-color:transparent}
.safety-card.solid svg,.safety-card.solid .dim{color:var(--on-safety-stop-solid)}
.type-row{display:grid;grid-template-columns:80px 1fr;gap:var(--space-3);align-items:baseline;padding:var(--space-2) 0;border-bottom:1px solid var(--line);overflow:hidden}
.space{display:flex;flex-direction:column;align-items:center;gap:4px}
.space span{background:var(--accent)}
.radius{width:64px;height:64px;background:var(--surface-2);border:1px solid var(--line-strong);display:grid;place-items:center}
.elev{width:96px;height:64px;border:1px solid;border-radius:var(--radius-lg);display:grid;place-items:center;font-size:var(--type-body-s-size);color:var(--text-2)}
.icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:var(--space-4) var(--space-2);color:var(--text-2)}
.icon{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.lift{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:var(--type-body-s-size);color:var(--text-2)}
.tag{margin-top:var(--space-8);font-family:var(--font-pixel);font-size:11px;color:var(--brand-miniquest-dim);display:flex;gap:6px;align-items:center}
.pip{width:8px;height:8px;background:var(--brand-miniquest-pip)}
`;

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tare D0 gallery</title>
<style>${css}</style>
</head>
<body>
<div class="themes">${renderToStaticMarkup(
  <>
    <Theme theme="dark" />
    <Theme theme="light" />
  </>,
)}</div>
</body>
</html>
`;

mkdirSync(join(pkg, 'gallery'), { recursive: true });
writeFileSync(join(pkg, 'gallery/index.html'), html);
console.log(
  `gallery: wrote ${join(pkg, 'gallery/index.html')} (${Math.round(html.length / 1024)} KB)`,
);

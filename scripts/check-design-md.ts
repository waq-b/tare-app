// CI check: docs/DESIGN.md lists every board in design/canvas/ and every component named
// on the Components and Charts boards. Run: node scripts/check-design-md.ts
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const canvas = join(root, 'design/canvas');
const design = readFileSync(join(root, 'docs/DESIGN.md'), 'utf8');

/** Section of DESIGN.md under a `## <n>. <title>` heading. */
function section(title: string): string {
  const start = design.search(new RegExp(`^## \\d+\\. ${title}`, 'm'));
  if (start < 0) throw new Error(`DESIGN.md has no "## N. ${title}" section`);
  const rest = design.slice(start + 1);
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
}

const problems: string[] = [];

const screens = section('Screen inventory');
const boards = readdirSync(canvas)
  .filter((f) => f.endsWith('.dc.html'))
  .map((f) => f.replace('.dc.html', ''));
for (const b of boards) {
  if (!new RegExp(`^\\|\\s*\`${b}\`\\s*\\|`, 'm').test(screens)) {
    problems.push(`Screen inventory is missing board \`${b}\``);
  }
}

// Component names as titled on the system boards, e.g. "SetRow" or "EvidenceBadge · SourceLink".
const components = section('Component inventory');
const SINGLE_WORD = new Set(['Button', 'Banner', 'Sheet', 'Meter', 'Heatmap']);
const isName = (w: string) => /^[A-Z][a-z]+(?:[A-Z][a-z]+)+$/.test(w) || SINGLE_WORD.has(w);
const titled = ['Components.dc.html', 'Charts.dc.html'].flatMap((board) => {
  const html = readFileSync(join(canvas, board), 'utf8');
  return [...html.matchAll(/>([^<]+)</g)]
    .map((m) => (m[1] as string).trim().split(/ [·+] /))
    .filter((words) => words.every(isName))
    .flat();
});
for (const name of new Set(titled)) {
  if (!new RegExp(`\`${name}\``).test(components)) {
    problems.push(`Component inventory is missing \`${name}\``);
  }
}

if (problems.length) {
  console.error(`DESIGN.md check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `DESIGN.md: ${boards.length} boards and ${new Set(titled).size} named components covered`,
);

// CI check (after `npm run build-storybook -w @tare/ui`): every board's D1 story in
// docs/DESIGN.md §4 exists, and every component named in §3 has a story.
// Run: node scripts/check-stories.ts
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const design = readFileSync(join(root, 'docs/DESIGN.md'), 'utf8');
const index = JSON.parse(
  readFileSync(join(root, 'packages/ui/storybook-static/index.json'), 'utf8'),
) as {
  entries: Record<string, { type: string; title: string; name: string }>;
};
const paths = Object.values(index.entries)
  .filter((e) => e.type === 'story')
  .map((e) => `${e.title}/${e.name}`);

function section(title: string): string {
  const start = design.search(new RegExp(`^## \\d+\\. ${title}`, 'm'));
  const rest = design.slice(start + 1);
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
}

const problems: string[] = [];

// §4: the "D1 story" column (5th cell) for every board that isn't reference-only.
for (const line of section('Screen inventory').split('\n')) {
  const cells = line.split('|').map((c) => c.trim());
  const board = /^`([^`]+)`$/.exec(cells[1] ?? '')?.[1];
  const story = cells[5];
  if (!board || !story || story === 'D1 story') continue;
  const want = story.replace(/\s*\(one story per result\)$/, '');
  if (!paths.some((p) => p.includes(want))) problems.push(`Board \`${board}\`: no story "${want}"`);
}

// §3: every component name in the first cell of each table row (not the reference-only row).
const names = new Set<string>();
for (const line of section('Component inventory').split('\n')) {
  if (!line.startsWith('| `') || line.includes('Reference only')) continue;
  const first = line.split('|')[1] ?? '';
  for (const m of first.matchAll(/`([A-Z][A-Za-z]+)`/g)) names.add(m[1] as string);
}
for (const n of names) {
  const re = new RegExp(`(^|[/ ])${n}($|[/ ·])`);
  if (!paths.some((p) => re.test(p))) problems.push(`Component \`${n}\` has no story`);
}

if (problems.length) {
  console.error(`Story coverage check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Stories: ${paths.length} stories cover every board and all ${names.size} components`);

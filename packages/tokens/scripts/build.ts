// Builds dist/ from src/tokens.json. Run with Node 24 (native type stripping).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, type TokenSource } from '../src/generate.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'src/tokens.json'), 'utf8')) as TokenSource;
const out = generate(src);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/tokens.css'), out.css);
writeFileSync(join(root, 'dist/index.js'), out.js);
writeFileSync(join(root, 'dist/index.d.ts'), out.dts);
console.log('tokens: wrote dist/tokens.css, dist/index.js, dist/index.d.ts');

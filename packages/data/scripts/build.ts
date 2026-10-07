// Writes dist/vpt-app.json, the slim dataset the web app ships.
//   npm run build -w @tare/data
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { loadVpt } from '../src/load.ts';
import { slimForApp } from '../src/slim.ts';
import { raw } from '../src/source-full.ts';

const out = join(dirname(fileURLToPath(import.meta.url)), '../dist/vpt-app.json');
const slim = slimForApp(raw);
const data = loadVpt(slim); // same schemas and version check as the full set
const json = JSON.stringify(slim);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, json);
const kb = (n: number) => `${Math.round(n / 1024)} KB`;
console.log(
  `vpt-app.json: v${data.version}, ${data.exercises.length} exercises, ${kb(json.length)} (${kb(gzipSync(json).length)} gzipped)`,
);

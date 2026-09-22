import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TokenSource } from '../src/generate.ts';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '../../..');

export function loadSource(): TokenSource {
  return JSON.parse(readFileSync(join(here, '../src/tokens.json'), 'utf8')) as TokenSource;
}

/** Visible text of a canvas board, with tags collapsed to ` | `. */
export function boardText(board: string): string {
  const html = readFileSync(join(repoRoot, 'design/canvas', board), 'utf8');
  return html
    .replace(/<helmet>[\s\S]*?<\/helmet>/, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<[^>]+>/g, '|')
    .replace(/\|[\s|]*/g, ' | ')
    .replace(/\s+/g, ' ');
}

/** WCAG 2.x contrast ratio between two #RRGGBB colours. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

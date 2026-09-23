// App icons from the "0.0" mark (the zeroed scale), in token colours. Writes public/*.png and
// favicon.svg; the output is committed. Run after a brand change:  npm run icons -w @tare/web
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokens } from '@tare/tokens';
import { chromium } from 'playwright';

const pub = join(dirname(fileURLToPath(import.meta.url)), '../public');
const require = createRequire(import.meta.url);
const font = readFileSync(
  require.resolve('@fontsource/azeret-mono/files/azeret-mono-latin-600-normal.woff2'),
).toString('base64');
const { bg, accent } = tokens.color.dark;

/** `inset` = share of the canvas the mark may use (maskable icons keep to the safe zone). */
const svg = (
  inset: number,
  embedFont: boolean,
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${embedFont ? `<style>@font-face{font-family:A;src:url(data:font/woff2;base64,${font})}</style>` : ''}
  <rect width="512" height="512" fill="${bg}"/>
  <text x="256" y="256" dominant-baseline="central" text-anchor="middle" fill="${accent}"
    font-family="A, 'Azeret Mono', ui-monospace, monospace" font-weight="600"
    font-size="${Math.round(236 * inset)}" letter-spacing="-8">0.0</text>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const shots: [string, number, number][] = [
  ['icon-192.png', 192, 0.8],
  ['icon-512.png', 512, 0.8],
  ['icon-maskable-512.png', 512, 0.62],
  ['apple-touch-icon.png', 180, 0.8],
];
for (const [file, size, inset] of shots) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0">${svg(inset, true).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`,
  );
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(join(pub, file), await page.screenshot({ type: 'png' }));
}
await browser.close();
writeFileSync(join(pub, 'favicon.svg'), svg(0.8, true));
console.log(`icons: ${shots.map((s) => s[0]).join(', ')}, favicon.svg`);

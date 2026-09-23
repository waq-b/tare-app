import react from '@vitejs/plugin-react';
import { tokens } from '@tare/tokens';
import { defaultClientConditions, defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const dark = tokens.color.dark;

/** index.html takes its theme colour from the tokens, not a copy. */
const themeColour = (): Plugin => ({
  name: 'tare-theme-colour',
  transformIndexHtml: (html) => html.replaceAll('%THEME_COLOUR%', dark.bg),
});

export default defineConfig({
  resolve: {
    // @tare/data loads the slim app bundle (docs/plans/P0.md T2), not the full vpt/data.
    conditions: ['tare-app', ...defaultClientConditions],
  },
  plugins: [
    react(),
    themeColour(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Tare',
        short_name: 'Tare',
        description: 'A calm gym logger with an honest coach.',
        lang: 'en-GB',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: dark.bg,
        theme_color: dark.bg,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell, fonts and the data bundle are all in the JS/CSS graph: precache everything.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});

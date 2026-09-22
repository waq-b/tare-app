import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineProject } from 'vitest/config';

/** Every story is a test: it must render, pass its play function, and have no axe violations
 * in either theme (stories render dark and light side by side under test). */
export default defineProject({
  // Story tests render every story in both themes, so axe checks dark and light at once.
  define: { 'import.meta.env.TARE_THEME': JSON.stringify('both') },
  plugins: [storybookTest({ configDir: fileURLToPath(new URL('.storybook', import.meta.url)) })],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});

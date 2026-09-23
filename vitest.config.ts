import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Each package's and app's vitest.config.ts, plus the browser-based story tests in packages/ui.
    projects: ['packages/*', 'apps/*', 'packages/ui/vitest.storybook.config.ts'],
    passWithNoTests: true,
  },
});

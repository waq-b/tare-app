import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Each package's vitest.config.ts, plus the browser-based story tests in packages/ui.
    projects: ['packages/*', 'packages/ui/vitest.storybook.config.ts'],
    passWithNoTests: true,
  },
});

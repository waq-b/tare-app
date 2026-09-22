import { defineProject } from 'vitest/config';

/** Unit tests (node): fixtures, style rules. Story tests run in vitest.storybook.config.ts. */
export default defineProject({
  test: {
    name: 'ui',
    include: ['test/**/*.test.ts'],
  },
});

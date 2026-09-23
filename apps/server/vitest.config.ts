import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'server',
    include: ['test/**/*.test.ts'],
    // One throwaway database per run (test/db.ts); tests in a file share it.
    fileParallelism: false,
  },
});

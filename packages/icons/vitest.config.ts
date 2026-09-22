import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'icons',
    environment: 'jsdom',
    // jsdom rewrites import.meta.url, so tests find repo files through this instead.
    env: { REPO_ROOT: fileURLToPath(new URL('../../', import.meta.url)) },
  },
});

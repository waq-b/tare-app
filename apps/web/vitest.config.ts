import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions } from 'vite';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [react()],
  resolve: {
    conditions: ['tare-app', ...defaultClientConditions],
    alias: {
      'virtual:pwa-register/react': fileURLToPath(new URL('test/pwa-stub.ts', import.meta.url)),
    },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});

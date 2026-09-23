import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/storybook-static/',
      '**/coverage/',
      'vpt/',
      'design/',
      'prompts/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: [
      'packages/*/src/**/*.tsx',
      'packages/*/stories/**/*.tsx',
      'apps/*/src/**/*.tsx',
      'apps/*/test/**/*.tsx',
    ],
    languageOptions: { globals: { ...globals.browser } },
    ...reactHooks.configs.flat['recommended-latest'],
  },
  {
    // Hard line 5: components are pure. No data loading, storage or network inside them.
    // Stories and fixtures may load data and pass it in as props.
    files: ['packages/ui/src/components/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@tare/data', '@tare/data/*'],
              message: 'Components are pure: pass data in as props (hard line 5).',
            },
            { group: ['**/vpt/**'], message: 'Only @tare/data reads vpt/ (CLAUDE.md §9).' },
            { group: ['**/fixtures', '**/fixtures/**'], message: 'Fixtures are for stories only.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...[
          'fetch',
          'localStorage',
          'sessionStorage',
          'indexedDB',
          'XMLHttpRequest',
          'WebSocket',
        ].map((name) => ({
          name,
          message: 'Components are pure: no network or storage (hard line 5).',
        })),
      ],
    },
  },
  {
    // The engine is pure: rules in, results out. No I/O, clocks or randomness.
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...[
          'fetch',
          'localStorage',
          'sessionStorage',
          'indexedDB',
          'XMLHttpRequest',
          'WebSocket',
        ].map((name) => ({ name, message: 'The engine is pure: pass data in (P0 plan T1).' })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'The engine is pure: pass the date in.' },
        { object: 'Math', property: 'random', message: 'The engine is pure: no randomness.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/vpt/**'], message: 'Only @tare/data reads vpt/ (CLAUDE.md §9).' },
          ],
        },
      ],
    },
  },
  {
    // Stories and tests index fixture data that's known to exist.
    files: ['**/*.stories.tsx', '**/stories/**/*.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  prettier,
);

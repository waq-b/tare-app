import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  core: { disableTelemetry: true },
  staticDirs: ['../public'],
  // The deployed Storybook is public but not for search engines (decision #43).
  managerHead: (head) => `${head ?? ''}<meta name="robots" content="noindex, nofollow" />`,
  previewHead: (head) => `${head ?? ''}<meta name="robots" content="noindex, nofollow" />`,
};

export default config;

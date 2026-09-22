import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import '../src/styles/global.css';
import './storybook.css';

type ThemeGlobal = 'dark' | 'light' | 'both';

/** Sets `data-theme` on the story root (and <html>, so portals like sheets match).
 * "Both" renders the story twice, dark and light, side by side. */
const withTheme: Decorator = (Story, ctx) => {
  const theme = (ctx.globals['theme'] ?? 'dark') as ThemeGlobal;
  const fullBleed = ctx.parameters['layout'] === 'fullscreen';
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme === 'light' ? 'light' : 'dark';
  }, [theme]);
  const root = (t: 'dark' | 'light') => (
    <div data-theme={t} className={fullBleed ? 'sb-root sb-full' : 'sb-root'}>
      <Story />
    </div>
  );
  if (theme === 'both') {
    return (
      <div className="sb-both">
        {root('dark')}
        {root('light')}
      </div>
    );
  }
  return root(theme);
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark (default)' },
          { value: 'light', title: 'Light' },
          { value: 'both', title: 'Both' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    // Story tests set TARE_THEME=both (vitest.storybook.config.ts) so axe checks both themes.
    theme: (import.meta.env['TARE_THEME'] as ThemeGlobal | undefined) ?? 'dark',
    viewport: { value: 'tare', isRotated: false },
  },
  parameters: {
    layout: 'padded',
    viewport: {
      options: {
        tare: { name: 'Tare 390×844', styles: { width: '390px', height: '844px' }, type: 'mobile' },
      },
    },
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    controls: { expanded: true },
  },
};

export default preview;

import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import '../src/styles/global.css';
import './storybook.css';
import { layoutProblems } from './layout';
import { smallTargets, TOUCH_MIN } from './touch';

type ThemeGlobal = 'dark' | 'light' | 'both';

const TEST_THEME = import.meta.env['TARE_THEME'] as ThemeGlobal | undefined;

/** "Both" renders every story twice, so landmarks (nav, header, main) appear twice. These axe
 * rules only check for duplicates or nesting across the page, so they're off in Both mode.
 * Every other rule, including colour contrast, runs on both themes. */
const DUPLICATE_LANDMARK_RULES = [
  'landmark-unique',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-main',
  'landmark-no-duplicate-contentinfo',
  'landmark-banner-is-top-level',
  'landmark-main-is-top-level',
  'landmark-contentinfo-is-top-level',
  'landmark-complementary-is-top-level',
].map((id) => ({ id, enabled: false }));

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
  afterEach: async ({ canvasElement, parameters }) => {
    if (!TEST_THEME || parameters['touchTargets'] === false) return;
    const small = smallTargets(canvasElement);
    if (small.length) throw new Error(`Touch targets under ${TOUCH_MIN}px:\n${small.join('\n')}`);
    if (parameters['layoutCheck'] === false) return;
    // Each themed copy is its own frame.
    const roots = [...canvasElement.querySelectorAll<HTMLElement>('.sb-root')];
    const layout = (roots.length ? roots : [canvasElement]).flatMap((r) => layoutProblems(r));
    if (layout.length) throw new Error(`Layout problems:\n${[...new Set(layout)].join('\n')}`);
  },
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
    theme: TEST_THEME ?? 'dark',
    viewport: { value: 'tare', isRotated: false },
  },
  parameters: {
    layout: 'padded',
    viewport: {
      options: {
        tare: { name: 'Tare 390×844', styles: { width: '390px', height: '844px' }, type: 'mobile' },
      },
    },
    a11y: {
      test: 'error',
      ...(TEST_THEME === 'both' ? { config: { rules: DUPLICATE_LANDMARK_RULES } } : {}),
    },
    backgrounds: { disable: true },
    controls: { expanded: true },
  },
};

export default preview;

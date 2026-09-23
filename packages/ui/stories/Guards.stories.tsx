// Guards for the story-test setup itself. Hidden from the sidebar ('!dev'), still tested.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = { title: 'Internal/Guards', tags: ['!dev', '!autodocs'] } satisfies Meta;
export default meta;

/** Story tests must render every story in dark and light, so axe checks both themes. */
export const RendersBothThemesUnderTest: StoryObj = {
  render: () => <p>Both themes</p>,
  play: async () => {
    const themes = [...document.querySelectorAll('.sb-root')].map((e) =>
      e.getAttribute('data-theme'),
    );
    await expect(themes).toEqual(['dark', 'light']);
  },
};

/** The touch-target check catches a small button (this story opts out of the check itself). */
export const TouchCheckCatchesSmallTargets: StoryObj = {
  parameters: { touchTargets: false },
  render: () => (
    <button type="button" style={{ width: 32, height: 32 }}>
      Go
    </button>
  ),
  play: async ({ canvasElement }) => {
    const { smallTargets } = await import('../.storybook/touch');
    await expect(smallTargets(canvasElement).join()).toMatch(/"Go" is 32×32/);
  },
};

/** The layout check catches content spilling out of the frame and overlapping text. */
export const LayoutCheckCatchesSpillsAndOverlaps: StoryObj = {
  parameters: { layoutCheck: false },
  render: () => (
    <div data-testid="frame" style={{ width: 390, position: 'relative' }}>
      <div style={{ width: 500 }}>Too wide</div>
      <span style={{ position: 'absolute', top: 0, left: 0 }}>Overlapping</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { layoutProblems } = await import('../.storybook/layout');
    const [frame] = canvasElement.querySelectorAll<HTMLElement>('[data-testid="frame"]');
    const found = layoutProblems(frame!).join('\n');
    await expect(found).toMatch(/"Too wide" spills 110px past the frame/);
    await expect(found).toMatch(
      /"Too wide" overlaps .*"Overlapping"|"Overlapping" overlaps .*"Too wide"/,
    );
  },
};

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

import { rule } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SourceLink } from './SourceLink';

const dp = rule('pr.double_progression');
const meta = {
  title: 'Components/Coach/SourceLink',
  component: SourceLink,
  args: { source: dp.sources[0]!, more: dp.sources.length - 1 },
} satisfies Meta<typeof SourceLink>;
export default meta;
export const WithMore: StoryObj<typeof meta> = {};
export const Single: StoryObj<typeof meta> = { args: { more: 0 } };

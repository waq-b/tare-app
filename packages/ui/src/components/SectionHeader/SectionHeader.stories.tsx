import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'Components/Structure/SectionHeader',
  component: SectionHeader,
  args: { title: 'Proposed changes', meta: '1 left to decide' },
} satisfies Meta<typeof SectionHeader>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const TitleOnly: StoryObj<typeof meta> = { args: { meta: undefined } };

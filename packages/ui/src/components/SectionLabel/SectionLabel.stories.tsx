import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionLabel } from './SectionLabel';

const meta = {
  title: 'Components/Structure/SectionLabel',
  component: SectionLabel,
  args: { children: 'Last time' },
} satisfies Meta<typeof SectionLabel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithTrailing: Story = { args: { children: 'Weekly sets', trailing: '8 weeks' } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiffChip } from './DiffChip';

const meta = {
  title: 'Components/Coach/DiffChip',
  component: DiffChip,
  args: { from: '3 × 10 @ 60', to: '3 × 6 @ 62.5' },
} satisfies Meta<typeof DiffChip>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Progress: Story = {};
export const Hold: Story = {
  args: { tone: 'hold', from: '47.5 kg', to: '42.5 kg, then build back up' },
};
export const Volume: Story = { args: { tone: 'swap', from: 'Not in plan', to: '2 sets' } };
export const Compact: Story = { render: () => <DiffChip to="+2.5" size="compact" /> };

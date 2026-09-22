import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SwapRow } from './SwapRow';

const meta = {
  title: 'Components/Workout/SwapRow',
  component: SwapRow,
  args: {
    name: 'DB bench press',
    pattern: 'push_h',
    reason: 'Same movement, different kit',
    load: '24 kg per hand',
    rank: 1,
    best: true,
    selected: true,
    onSelect: fn(),
  },
} satisfies Meta<typeof SwapRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RankedSelected: Story = {};
export const Ranked: Story = {
  args: {
    name: 'Push-up',
    reason: 'Easier version',
    load: 'BW',
    rank: 6,
    best: false,
    selected: false,
  },
};
export const Compact: Story = {
  render: (args) => (
    <SwapRow name={args.name} pattern={args.pattern} load={args.load ?? ''} href="#" />
  ),
};

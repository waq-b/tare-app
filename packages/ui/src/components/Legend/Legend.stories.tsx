import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartLegend, Legend } from './Legend';

const meta = { title: 'Components/Data/Legend', component: Legend } satisfies Meta<typeof Legend>;
export default meta;
export const BodyMapKey: StoryObj<typeof meta> = {
  args: {
    label: 'Body map key',
    items: [
      { label: 'Active', color: 'var(--muscle-primary)' },
      { label: 'Cleared', color: 'var(--muscle-secondary)' },
    ],
  },
};
export const ChartKey: StoryObj<typeof meta> = {
  args: {
    items: [
      { label: 'Daily weigh-in', color: 'var(--text-3)', mark: 'dot' },
      { label: '7-day average', color: 'var(--accent)', mark: 'line' },
      { label: 'Target band', color: 'var(--progress)', mark: 'dashed' },
    ],
  },
};

export const ChartLegendStory: StoryObj<typeof meta> = {
  name: 'ChartLegend',
  args: { items: [] },
  render: () => (
    <ChartLegend items={[{ label: 'e1RM (estimated)', color: 'var(--accent)', mark: 'line' }]} />
  ),
};

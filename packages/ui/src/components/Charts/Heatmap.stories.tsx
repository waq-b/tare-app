import type { Meta, StoryObj } from '@storybook/react-vite';
import { Legend } from '../Legend/Legend';
import { Heatmap } from './Bars';
import { heatWeeks } from '../../../fixtures/charts';

const meta = {
  title: 'Components/Data/Heatmap',
  component: Heatmap,
  args: { weeks: heatWeeks, label: 'Consistency' },
} satisfies Meta<typeof Heatmap>;
export default meta;
export const Consistency: StoryObj<typeof meta> = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <Heatmap {...args} />
      <Legend
        items={[
          { label: 'Rest', color: 'var(--surface-2)' },
          { label: 'Shorter', color: 'color-mix(in srgb, var(--accent) 35%, transparent)' },
          { label: 'Longer session', color: 'var(--accent)' },
        ]}
      />
    </div>
  ),
};

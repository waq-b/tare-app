import type { Meta, StoryObj } from '@storybook/react-vite';
import { Legend } from '../Legend/Legend';
import { weighInAvg, weighInRaw } from '../../../fixtures/charts';
import { TrendChart } from './LineChart';

const meta = {
  title: 'Components/Data/TrendChart',
  component: TrendChart,
  args: { raw: weighInRaw, average: weighInAvg, label: 'Bodyweight, kg', unit: 'kg' },
} satisfies Meta<typeof TrendChart>;
export default meta;
export const Bodyweight: StoryObj<typeof meta> = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <TrendChart {...args} />
      <Legend
        items={[
          { label: 'Weigh-in', color: 'var(--text-3)', mark: 'dot' },
          { label: '7-day average', color: 'var(--accent)', mark: 'line' },
        ]}
      />
    </div>
  ),
};

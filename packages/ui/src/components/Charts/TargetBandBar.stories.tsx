import type { Meta, StoryObj } from '@storybook/react-vite';
import { TargetBandBar } from './Bars';
import { setBand, setsWeek8 } from '../../../fixtures/charts';

const meta = {
  title: 'Components/Data/TargetBandBar',
  component: TargetBandBar,
  args: { label: 'Chest', value: 6, band: setBand, scaleMax: 16 },
} satisfies Meta<typeof TargetBandBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OneMuscle: Story = {};
export const WeeklySets: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 4 }}>
      {setsWeek8.map((m) => (
        <TargetBandBar key={m.label} label={m.label} value={m.value} band={setBand} scaleMax={16} />
      ))}
    </div>
  ),
};

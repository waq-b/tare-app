import type { Meta, StoryObj } from '@storybook/react-vite';
import { benchE1rm } from '../../../fixtures/charts';
import { HeroNumber, StatTile } from './Stats';

const meta = {
  title: 'Components/Data/StatTile',
  component: StatTile,
  args: { label: 'Time', value: '54', unit: 'min' },
} satisfies Meta<typeof StatTile>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tile: Story = {};
export const Tiles: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      <StatTile label="Time" value="54" unit="min" />
      <StatTile label="Volume" value="7,960" unit="kg" />
      <StatTile label="Sets" value="16" caption="+1 vs last" captionTone="progress" />
    </div>
  ),
};
export const HeroNumberStory: Story = {
  name: 'HeroNumber',
  render: () => (
    <HeroNumber
      label="Bench press e1RM"
      qualifier="estimated"
      value={String(benchE1rm.at(-1)?.y)}
      unit="kg"
      delta={`+${(benchE1rm.at(-1)!.y - benchE1rm[0]!.y).toFixed(1)} since ${benchE1rm[0]!.x}`}
      deltaTone="progress"
    />
  ),
};

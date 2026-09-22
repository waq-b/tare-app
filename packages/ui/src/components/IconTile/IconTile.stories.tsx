import { Icon, PatternIcon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconTile } from './IconTile';

const meta = {
  title: 'Components/Structure/IconTile',
  component: IconTile,
  args: { children: <PatternIcon pattern="push_h" size={26} /> },
} satisfies Meta<typeof IconTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pattern: Story = {};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
      {([40, 48, 56, 64, 72] as const).map((s) => (
        <IconTile key={s} {...args} size={s} />
      ))}
    </div>
  ),
};
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      {(['warning', 'deload', 'swap', 'hold', 'safety', 'accent'] as const).map((t) => (
        <IconTile key={t} tone={t} size={64}>
          <Icon name="alert" size={28} />
        </IconTile>
      ))}
    </div>
  ),
};
export const Dashed: Story = {
  args: { dashed: true, size: 72, children: <Icon name="chart" size={30} /> },
};

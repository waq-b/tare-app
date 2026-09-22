import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Components/Inputs/Checkbox',
  component: Checkbox,
  args: { label: 'Use 72.5 kg for set 3 too', checked: true },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Row: Story = {};
export const RowUnchecked: Story = { args: { checked: false } };
export const Tiles: Story = {
  render: function Render() {
    const [kit, setKit] = useState<Record<string, boolean>>({
      'Barbell + rack': true,
      Bench: true,
      Dumbbells: true,
      Kettlebells: false,
    });
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(kit).map(([k, v]) => (
          <Checkbox
            key={k}
            variant="tile"
            label={k}
            checked={v}
            onChange={(c) => setKit({ ...kit, [k]: c })}
          />
        ))}
      </div>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ChoiceChip } from './ChoiceChip';

const meta = {
  title: 'Components/Inputs/ChoiceChip',
  component: ChoiceChip,
  args: { children: 'Shoulder', selected: true },
} satisfies Meta<typeof ChoiceChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {};
export const Unselected: Story = { args: { selected: false } };
export const FilledAccent: Story = {
  args: { variant: 'filled', tone: 'accent', children: 'Too heavy' },
};

export const MultiSelect: Story = {
  globals: { theme: 'dark' },
  render: function Render() {
    const [on, setOn] = useState<string[]>(['Shoulder']);
    const areas = [
      'Neck',
      'Shoulder',
      'Elbow',
      'Wrist',
      'Upper back',
      'Lower back',
      'Hip',
      'Knee',
      'Ankle',
      'Calf',
    ];
    return (
      <div
        role="group"
        aria-label="Where does it hurt?"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {areas.map((a) => (
          <ChoiceChip
            key={a}
            selected={on.includes(a)}
            onToggle={() => setOn(on.includes(a) ? on.filter((x) => x !== a) : [...on, a])}
          >
            {a}
          </ChoiceChip>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const knee = c.getByRole('button', { name: 'Knee' });
    await userEvent.click(knee);
    await expect(knee).toHaveAttribute('aria-pressed', 'true');
    knee.focus();
    await userEvent.keyboard(' ');
    await expect(knee).toHaveAttribute('aria-pressed', 'false');
  },
};

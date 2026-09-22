import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioCard } from './RadioCard';

const meta = {
  title: 'Components/Inputs/RadioCard',
  component: RadioCard,
  args: {
    name: 'demo',
    value: 'a',
    checked: true,
    title: 'Comes on during a set',
    hint: 'Started or got worse while lifting',
  },
} satisfies Meta<typeof RadioCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Checked: Story = {};
export const Group: Story = {
  render: function Render() {
    const [v, setV] = useState('during');
    const opts = [
      ['during', 'Comes on during a set', 'Started or got worse while lifting'],
      ['after', 'Sore a day or two after', 'Dull, achy, muscle feels worked'],
      ['injury', 'Something went', 'A pop, tear or twist'],
    ] as const;
    return (
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        <legend style={{ marginBottom: 8 }}>When does it hurt?</legend>
        {opts.map(([value, title, hint]) => (
          <RadioCard
            key={value}
            name="when"
            value={value}
            title={title}
            hint={hint}
            checked={v === value}
            onChange={setV}
          />
        ))}
      </fieldset>
    );
  },
};

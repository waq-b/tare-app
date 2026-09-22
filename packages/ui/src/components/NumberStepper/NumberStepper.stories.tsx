import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { NumberStepper } from './NumberStepper';

const meta = {
  title: 'Components/Inputs/NumberStepper',
  component: NumberStepper,
  args: { label: 'Weight', value: 72.5, step: 2.5, unit: 'kg' },
} satisfies Meta<typeof NumberStepper>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Weight: Story = {};
export const Reps: Story = { render: () => <NumberStepper label="Reps" value={8} step={1} /> };
export const Large: Story = { args: { label: 'Bodyweight', value: 88.4, step: 0.1, size: 76 } };

/** Steps with −/+, then types a value. */
export const StepAndType: Story = {
  globals: { theme: 'dark' },
  render: function Render(args) {
    const [v, setV] = useState(70);
    return <NumberStepper {...args} value={v} onChange={setV} />;
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Increase Weight' }));
    await expect(c.getByText('72.5')).toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: /Tap to type/ }));
    const input = c.getByRole('spinbutton', { name: 'Weight' });
    await userEvent.clear(input);
    await userEvent.type(input, '75{Enter}');
    await expect(c.getByText('75')).toBeInTheDocument();
  },
};

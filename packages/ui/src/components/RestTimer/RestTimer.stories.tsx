import { goal } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { RestTimer } from './RestTimer';

// Target rest from tr.goal.fat_loss (inherits hypertrophy): the top of rest_seconds.
const [, restMax] = goal('tr.goal.fat_loss')['rest_seconds'] as [number, number];

const meta = {
  title: 'Components/Workout/RestTimer',
  component: RestTimer,
  args: { remaining: 92, total: restMax, next: 'set 3 · 62.5 × 6' },
} satisfies Meta<typeof RestTimer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};
export const Docked: Story = { args: { variant: 'docked', remaining: 28 } };

/** ±15s and Skip call back; the app owns the countdown. */
export const Adjust: Story = {
  globals: { theme: 'dark' },
  render: function Render(args) {
    const [left, setLeft] = useState(92);
    const [skipped, setSkipped] = useState(false);
    return skipped ? (
      <p>Skipped</p>
    ) : (
      <RestTimer
        {...args}
        remaining={left}
        onAdjust={(d) => setLeft(Math.max(0, left + d))}
        onSkip={() => setSkipped(true)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: '15 seconds more' }));
    await expect(c.getByRole('timer')).toHaveTextContent('1:47');
    await userEvent.click(c.getByRole('button', { name: 'Skip' }));
    await expect(c.getByText('Skipped')).toBeInTheDocument();
  },
};

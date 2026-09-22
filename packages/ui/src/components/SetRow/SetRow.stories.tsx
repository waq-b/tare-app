import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { SetRow, type SetRowState } from './SetRow';

const meta = {
  title: 'Components/Workout/SetRow',
  component: SetRow,
  args: { index: 1, load: 62.5, reps: 6 },
} satisfies Meta<typeof SetRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WarmUp: Story = { args: { state: 'warmup', load: 30, reps: 5 } };
export const Done: Story = { args: { state: 'done', effort: 'OK' } };
export const Current: Story = { args: { state: 'current', index: 2, lastTime: '60×10' } };
export const Upcoming: Story = { args: { state: 'upcoming', index: 3 } };
export const PerHand: Story = {
  args: { state: 'current', load: 18, reps: 8, loadConvention: 'per_hand' },
};
export const Bodyweight: Story = {
  args: { state: 'upcoming', load: null, reps: 15, loadConvention: 'bodyweight' },
};

/** One tap logs the current set; the next becomes current. */
export const LogASet: Story = {
  globals: { theme: 'dark' },
  args: { state: 'current' },
  render: function Render() {
    const [done, setDone] = useState(1);
    const state = (i: number): SetRowState =>
      i < done ? 'done' : i === done ? 'current' : 'upcoming';
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <SetRow
            key={i}
            state={state(i)}
            index={i + 1}
            load={62.5}
            reps={6}
            effort="OK"
            lastTime="60×10"
            onCheck={() => setDone(i < done ? i : i + 1)}
          />
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Mark set 2 done as planned' }));
    await expect(c.getByRole('button', { name: 'Set 2 done, undo' })).toBeInTheDocument();
    await expect(c.getByRole('button', { name: 'Mark set 3 done as planned' })).toBeInTheDocument();
  },
};

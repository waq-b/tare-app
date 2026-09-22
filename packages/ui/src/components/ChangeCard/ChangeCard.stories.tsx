import { displayName, exercise, rule } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { review } from '../../../fixtures';
import { ChangeCard, type DecisionState } from './ChangeCard';

const REASONS = [
  { value: 'too_heavy', label: 'Too heavy' },
  { value: 'dont_like', label: 'Don’t like it' },
  { value: 'no_kit', label: 'No kit' },
];

const card = (id: string) => {
  const c = review.changes.find((x) => x.id === id)!;
  return {
    kind: c.kind,
    exercise: displayName(exercise(c.exerciseId)),
    from: c.from,
    to: c.to,
    rationale: c.rationale,
    rules: c.ruleIds.map((r) => rule(r)),
    state: c.state,
    reasonOptions: REASONS,
    keepReason: c.keepReason ?? null,
  };
};

const meta = {
  title: 'Components/Coach/ChangeCard',
  component: ChangeCard,
  args: card('c2'),
} satisfies Meta<typeof ChangeCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};
export const Accepted: Story = { args: card('c1') };
export const KeptWithReason: Story = { args: card('c3') };
export const Volume: Story = { args: card('c4') };

/** Accept → Undo → Keep → pick a reason. */
export const Decide: Story = {
  globals: { theme: 'dark' },
  render: function Render(args) {
    const [state, setState] = useState<DecisionState>('pending');
    const [reason, setReason] = useState<string | null>(null);
    return (
      <ChangeCard
        {...args}
        state={state}
        keepReason={reason}
        onAccept={() => setState('accepted')}
        onKeep={() => setState('kept')}
        onUndo={() => {
          setState('pending');
          setReason(null);
        }}
        onReason={setReason}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: /^Accept/ }));
    await expect(c.getByRole('status')).toHaveTextContent('Accepted');
    await userEvent.click(c.getByRole('button', { name: 'Undo' }));
    await userEvent.click(c.getByRole('button', { name: /^Keep as is/ }));
    await userEvent.click(c.getByRole('button', { name: 'Too heavy' }));
    await expect(c.getByRole('status')).toHaveTextContent('Kept as is · Too heavy');
  },
};

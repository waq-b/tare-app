import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { RankedChoice } from './RankedChoice';

// Goals map to tr.goal.* (fat_loss, hypertrophy, strength, general). The labels are UI copy.
const goals = [
  { value: 'fat_loss', label: 'Lose fat' },
  { value: 'hypertrophy', label: 'Build muscle' },
  { value: 'strength', label: 'Get stronger' },
  { value: 'general', label: 'General health' },
];

const meta = {
  title: 'Components/Onboarding/RankedChoice',
  component: RankedChoice,
  args: { label: 'What matters most?', options: goals, ranking: ['fat_loss', 'strength'] },
} satisfies Meta<typeof RankedChoice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const TwoRanked: Story = {};
export const None: Story = { args: { ranking: [] } };
export const Rank: Story = {
  globals: { theme: 'dark' },
  args: { ranking: [] },
  render: function Render(args) {
    const [r, setR] = useState<string[]>([]);
    return (
      <RankedChoice
        {...args}
        ranking={r}
        onToggle={(v) => setR(r.includes(v) ? r.filter((x) => x !== v) : [...r, v])}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Get stronger' }));
    await userEvent.click(c.getByRole('button', { name: 'Lose fat' }));
    await expect(c.getByRole('button', { name: /Get stronger/ })).toHaveTextContent('1st');
    await expect(c.getByRole('button', { name: /Lose fat/ })).toHaveTextContent('2nd');
    await expect(c.getByRole('button', { name: 'General health' })).toBeDisabled();
  },
};

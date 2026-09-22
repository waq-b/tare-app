import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'Components/Inputs/SegmentedControl',
  component: SegmentedControl,
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;

const days = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
] as const;

export const Accent: Story = { args: { label: 'Days per week', options: days, value: '3' } };
export const Neutral: Story = {
  args: {
    label: 'Any chest pain?',
    tone: 'neutral',
    value: 'no',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
};
export const Compact: Story = {
  args: {
    label: 'Range',
    size: 'compact',
    value: '8w',
    options: ['4w', '8w', '6m', '1y', 'all'].map((v) => ({ value: v, label: v.toUpperCase() })),
  },
};
export const Unanswered: Story = { args: { label: 'Days per week', options: days, value: null } };

/** Arrow keys move the selection; only the selected option is in the tab order. */
export const Keyboard: Story = {
  globals: { theme: 'dark' },
  args: { label: 'Days per week', options: days, value: '3' },
  render: function Render(args) {
    const [v, setV] = useState<string | null>('3');
    return <SegmentedControl {...args} value={v} onChange={setV} />;
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const three = c.getByRole('radio', { name: '3' });
    three.focus();
    await userEvent.keyboard('{ArrowRight}');
    const four = c.getByRole('radio', { name: '4' });
    await expect(four).toHaveAttribute('aria-checked', 'true');
    await expect(four).toHaveFocus();
    await expect(three).toHaveAttribute('tabindex', '-1');
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { benchE1rm } from '../../../fixtures/charts';
import { LineChart } from './LineChart';

const meta = {
  title: 'Components/Data/LineChart',
  component: LineChart,
  args: { points: benchE1rm, label: 'Bench press e1RM, kg (estimated)', unit: 'kg' },
} satisfies Meta<typeof LineChart>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Full: Story = {};
export const Compact: Story = { args: { variant: 'compact' } };

/** Arrow keys move the crosshair; the tooltip reads the point. */
export const KeyboardScrub: Story = {
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const chart = c.getByRole('img', { name: /Bench press e1RM/ });
    chart.focus();
    await userEvent.keyboard('{ArrowLeft}');
    const tip = c.getByRole('status');
    await expect(tip).toHaveTextContent(benchE1rm.at(-2)!.x);
  },
};

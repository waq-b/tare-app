import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { benchE1rm } from '../../../fixtures/charts';
import { LineChart } from './LineChart';
import { ChartFrame, DataTable } from './Table';

const table = (
  <DataTable
    caption="Bench press e1RM by session, kg (estimated)"
    columns={[
      { key: 'x', label: 'Session', rowHeader: true },
      { key: 'y', label: 'e1RM', numeric: true },
    ]}
    rows={benchE1rm}
  />
);
const meta = {
  title: 'Components/Data/ChartFrame',
  component: ChartFrame,
  args: {
    title: 'Bench press',
    note: 'e1RM is estimated from sets of 10 reps or fewer',
    chart: <LineChart points={benchE1rm} label="Bench press e1RM, kg (estimated)" unit="kg" />,
    table,
  },
} satisfies Meta<typeof ChartFrame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Chart: Story = {};
export const Table: Story = { args: { initialView: 'table' } };
export const SwitchToTable: Story = {
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('radio', { name: 'Table' }));
    await expect(c.getByRole('table')).toBeInTheDocument();
  },
};

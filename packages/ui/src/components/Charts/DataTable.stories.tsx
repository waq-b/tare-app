import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { liftRows } from '../../../fixtures/charts';
import { Sparkline } from './LineChart';
import { DataTable, type Column } from './Table';

type Row = (typeof liftRows)[number];
const columns: Column<Row>[] = [
  { key: 'lift', label: 'Lift', rowHeader: true },
  { key: 'top', label: 'Top set', numeric: true },
  { key: 'e1rm', label: 'e1RM', numeric: true, sortable: true },
  {
    key: 'change',
    label: '6 wk',
    numeric: true,
    sortable: true,
    render: (r) => `${r.change >= 0 ? '+' : ''}${r.change}`,
    tone: (r) => (r.change > 0 ? 'progress' : 'neutral'),
  },
  { key: 'trend', label: 'Trend', render: (r) => <Sparkline values={r.trend} /> },
];

const meta = {
  title: 'Components/Data/DataTable',
  component: DataTable<Row>,
  args: { caption: 'All lifts: estimated 1RM, kg', columns, rows: liftRows, sortBy: 'e1rm' },
} satisfies Meta<typeof DataTable<Row>>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Lifts: Story = {};
export const Sort: Story = {
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const e1rm = c.getByRole('columnheader', { name: /e1RM/ });
    await expect(e1rm).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(within(e1rm).getByRole('button'));
    await expect(e1rm).toHaveAttribute('aria-sort', 'ascending');
  },
};

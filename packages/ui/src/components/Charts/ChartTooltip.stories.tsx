import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartTooltip } from './LineChart';

const meta = {
  title: 'Components/Data/ChartTooltip',
  component: ChartTooltip,
  args: { title: 'Tue 15 Sep', value: '80 kg', detail: '60 × 10 · Hard' },
} satisfies Meta<typeof ChartTooltip>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

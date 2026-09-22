import type { Meta, StoryObj } from '@storybook/react-vite';
import { FIXTURE_MEALS_TODAY } from '../../../fixtures';
import { MealRow } from './MealRow';

const meta = {
  title: 'Components/Food/MealRow',
  component: MealRow,
  args: { ...FIXTURE_MEALS_TODAY[1] },
} satisfies Meta<typeof MealRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Logged: Story = {};
export const NotLogged: Story = { args: { ...FIXTURE_MEALS_TODAY[3] } };
export const Day: Story = {
  render: () => (
    <div>
      {FIXTURE_MEALS_TODAY.map((m) => (
        <MealRow key={m.name} {...m} />
      ))}
    </div>
  ),
};

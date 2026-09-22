import type { Meta, StoryObj } from '@storybook/react-vite';
import { FIXTURE_FOOD_TARGETS, FIXTURE_FOOD_WEEK, shortDate } from '../../../fixtures';
import { DayDots } from './Bars';

const days = FIXTURE_FOOD_WEEK.map((d) => ({
  letter: shortDate(d.date).slice(0, 1),
  name: shortDate(d.date),
  state:
    d.proteinG == null
      ? ('none' as const)
      : d.proteinG >= FIXTURE_FOOD_TARGETS.proteinG
        ? ('hit' as const)
        : ('miss' as const),
}));
const meta = {
  title: 'Components/Data/DayDots',
  component: DayDots,
  args: { days, label: 'Protein target this week' },
} satisfies Meta<typeof DayDots>;
export default meta;
export const ProteinWeek: StoryObj<typeof meta> = {};

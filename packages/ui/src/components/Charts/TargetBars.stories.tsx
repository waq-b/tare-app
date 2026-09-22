import type { Meta, StoryObj } from '@storybook/react-vite';
import { FIXTURE_FOOD_TARGETS, FIXTURE_FOOD_WEEK, shortDate } from '../../../fixtures';
import { TargetBars } from './Bars';

// FIXTURE food targets: vpt has none yet (#20).
const band = {
  min: FIXTURE_FOOD_TARGETS.energyKcal - 200,
  max: FIXTURE_FOOD_TARGETS.energyKcal + 100,
};
const meta = {
  title: 'Components/Data/TargetBars',
  component: TargetBars,
  args: {
    bars: FIXTURE_FOOD_WEEK.map((d) => ({ label: shortDate(d.date).slice(0, 1), value: d.kcal })),
    band,
    label: 'Energy this week, kcal (imported)',
    unit: 'kcal',
  },
} satisfies Meta<typeof TargetBars>;
export default meta;
export const Week: StoryObj<typeof meta> = {};

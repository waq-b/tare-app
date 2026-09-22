import type { Meta, StoryObj } from '@storybook/react-vite';
import { FIXTURE_FOOD_TARGETS } from '../../../fixtures';
import { Meter } from './Bars';

const meta = {
  title: 'Components/Data/Meter',
  component: Meter,
  args: { label: 'Protein', value: 108, target: FIXTURE_FOOD_TARGETS.proteinG, unit: 'g' },
} satisfies Meta<typeof Meter>;
export default meta;
export const Protein: StoryObj<typeof meta> = {};
export const Energy: StoryObj<typeof meta> = {
  args: { label: 'Energy', value: 1310, target: FIXTURE_FOOD_TARGETS.energyKcal, unit: 'kcal' },
};

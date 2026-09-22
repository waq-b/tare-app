import type { Meta, StoryObj } from '@storybook/react-vite';
import { FIXTURE_MACROS_TODAY } from '../../../fixtures';
import { MacroBar } from './Bars';

const meta = {
  title: 'Components/Data/MacroBar',
  component: MacroBar,
  args: {
    segments: [
      { label: 'Protein', grams: FIXTURE_MACROS_TODAY.proteinG },
      { label: 'Carbs', grams: FIXTURE_MACROS_TODAY.carbsG },
      { label: 'Fat', grams: FIXTURE_MACROS_TODAY.fatG },
    ],
  },
} satisfies Meta<typeof MacroBar>;
export default meta;
export const Today: StoryObj<typeof meta> = {};

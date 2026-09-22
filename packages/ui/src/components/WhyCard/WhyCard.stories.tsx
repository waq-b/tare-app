import { rule } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { WhyCard } from './WhyCard';

const meta = {
  title: 'Components/Coach/WhyCard',
  component: WhyCard,
  args: {
    children:
      'When every set reaches the top of your rep range twice in a row, the weight goes up and the reps start again at the bottom.',
    rules: [rule('pr.double_progression')],
  },
} satisfies Meta<typeof WhyCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusHero } from './StatusHero';

const meta = {
  title: 'Components/Feedback/StatusHero',
  component: StatusHero,
  args: { icon: <Icon name="moon" size={28} />, title: 'Rest day.' },
} satisfies Meta<typeof StatusHero>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Neutral: Story = { args: { children: 'Next session is on Thursday.' } };
export const Warning: Story = {
  args: {
    tone: 'warning',
    icon: <Icon name="alert" size={28} />,
    eyebrow: 'See your GP',
    title: 'Check with your GP first.',
  },
};
export const Centred: Story = {
  args: {
    align: 'center',
    dashed: true,
    icon: <Icon name="chart" size={28} />,
    title: 'Nothing to chart yet',
    children: 'Log a session to start.',
  },
};

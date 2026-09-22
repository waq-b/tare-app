import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderAction } from './PlaceholderAction';

const meta = {
  title: 'Components/Actions/PlaceholderAction',
  component: PlaceholderAction,
  args: {
    icon: <Icon name="bike" size={20} />,
    title: 'Log a ride',
    subtitle: 'Minutes + effort · coming later',
  },
} satisfies Meta<typeof PlaceholderAction>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { EffortTap } from './EffortTap';

const meta = { title: 'Components/Inputs/EffortTap', component: EffortTap } satisfies Meta<
  typeof EffortTap
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SetUnanswered: Story = {
  args: { scale: 'set', question: 'How was set 2?', value: null },
};
export const SetOK: Story = { args: { scale: 'set', question: 'How was set 2?', value: 'ok' } };
export const Session: Story = {
  args: { scale: 'session', question: 'How did the session feel?', value: 'good' },
};

import { rule } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RuleChip, RuleCitation } from './RuleCitation';

const meta = {
  title: 'Components/Coach/RuleCitation',
  component: RuleCitation,
  args: { rule: rule('pr.double_progression') },
} satisfies Meta<typeof RuleCitation>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DoubleProgression: Story = {};
export const StallStep: Story = { args: { rule: rule('pr.stall.step2') } };
export const Conflict: Story = {
  name: 'No sources or rating (a documented conflict)',
  args: { rule: rule('tr.conflict.rest') },
};
export const RuleChipOnly: Story = {
  name: 'RuleChip',
  render: () => <RuleChip rule={rule('pr.volume_progression')} />,
};

import { safetyRule } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { painFlags, shortDate } from '../../../fixtures';
import { PainFlagCard } from './PainFlagCard';

const [active, cleared] = painFlags;
const meta = {
  title: 'Components/Safety/PainFlagCard',
  component: PainFlagCard,
  args: {
    area: 'Right shoulder',
    when: `Flagged ${shortDate(active!.date)}`,
    status: 'active',
    rule: safetyRule(active!.ruleId),
    allFlagsHref: '#',
  },
} satisfies Meta<typeof PainFlagCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Active: Story = {};
export const Cleared: Story = {
  args: {
    area: 'Left ankle',
    status: 'cleared',
    when: `Cleared ${shortDate(cleared!.clearedOn!)}`,
    rule: safetyRule(cleared!.ruleId),
  },
};

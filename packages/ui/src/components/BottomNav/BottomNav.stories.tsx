import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomNav } from './BottomNav';

const meta = {
  title: 'Components/Structure/BottomNav',
  component: BottomNav,
  parameters: { layout: 'fullscreen' },
  args: { active: 'today' },
} satisfies Meta<typeof BottomNav>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Today: Story = {};
export const Plan: Story = { args: { active: 'plan' } };
export const Progress: Story = { args: { active: 'progress' } };
export const CoachWithBadge: Story = { args: { active: 'today', badges: { coach: true } } };
export const NoneActive: Story = { args: { active: null } };

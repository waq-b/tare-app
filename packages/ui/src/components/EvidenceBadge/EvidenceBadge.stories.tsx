import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvidenceBadge } from './EvidenceBadge';

const meta = { title: 'Components/Coach/EvidenceBadge', component: EvidenceBadge } satisfies Meta<
  typeof EvidenceBadge
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Strong: Story = { args: { strength: 'strong' } };
export const Moderate: Story = { args: { strength: 'moderate' } };
export const Weak: Story = { args: { strength: 'weak' } };
export const NoRating: Story = { args: { strength: undefined } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { InlineNote } from './InlineNote';

const meta = {
  title: 'Components/Feedback/InlineNote',
  component: InlineNote,
  args: { children: 'Includes 1 change you accepted on Sunday' },
} satisfies Meta<typeof InlineNote>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Info: Story = {};
export const Synced: Story = { args: { kind: 'synced', children: 'Synced · 19:42' } };
export const Imported: Story = {
  args: { kind: 'imported', children: 'Imported from your food app · 14:05' },
};

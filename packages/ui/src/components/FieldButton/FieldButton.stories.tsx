import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldButton } from './FieldButton';

const meta = {
  title: 'Components/Inputs/FieldButton',
  component: FieldButton,
  args: { label: 'When', value: 'Today, 07:12' },
} satisfies Meta<typeof FieldButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Filled: Story = {};
export const EmptyOptional: Story = {
  args: { label: 'Waist · optional', value: undefined, placeholder: 'Add waist' },
};

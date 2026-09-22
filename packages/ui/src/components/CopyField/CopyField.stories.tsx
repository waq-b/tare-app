import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CopyField } from './CopyField';

const meta = {
  title: 'Components/Inputs/CopyField',
  component: CopyField,
  args: { value: 'https://tare.example.com/mcp', copyLabel: 'Copy server URL', onCopy: fn() },
} satisfies Meta<typeof CopyField>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

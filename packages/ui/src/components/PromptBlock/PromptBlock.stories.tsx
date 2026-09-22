import type { Meta, StoryObj } from '@storybook/react-vite';
import { PromptBlock } from './PromptBlock';

const meta = {
  title: 'Components/Structure/PromptBlock',
  component: PromptBlock,
  args: {
    label: 'Bootstrap prompt',
    children: 'Use the Tare tools. Call get_coach_brief first and follow it.',
  },
} satisfies Meta<typeof PromptBlock>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

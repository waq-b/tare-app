import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextLink } from './TextLink';

const meta = {
  title: 'Components/Actions/TextLink',
  component: TextLink,
  args: { children: 'See the rulebook', href: '#' },
} satisfies Meta<typeof TextLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithChevron: Story = { args: { children: 'See this week', chevron: true } };
export const External: Story = { args: { children: 'NHS 111 online', external: true } };
export const AsButton: Story = {
  render: () => <TextLink onClick={() => undefined}>Undo</TextLink>,
};

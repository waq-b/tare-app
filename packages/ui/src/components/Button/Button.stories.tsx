import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Actions/Button',
  component: Button,
  args: { children: 'Start workout', onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas }) => {
    const [first] = canvas.getAllByRole('button', { name: 'Start workout' });
    await userEvent.click(first as HTMLElement);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="secondary-outline">
        Secondary outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="hold">
        Hold tone
      </Button>
      <Button {...args} variant="swap">
        Swap tone
      </Button>
      <Button {...args} variant="deload">
        Deload tone
      </Button>
      <Button {...args} variant="warning" icon={<Icon name="phone" size={20} />}>
        Warning tone
      </Button>
      <Button {...args} disabled>
        Disabled
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {([64, 60, 52, 44] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {`Size ${size}`}
        </Button>
      ))}
    </div>
  ),
};

export const WithValue: Story = {
  args: { children: 'Done', value: '70 × 8', size: 64, fullWidth: true },
};

export const Emergency: Story = {
  args: {
    variant: 'emergency',
    children: 'Call 999',
    icon: <Icon name="phone" size={24} />,
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--safety-stop-solid)', padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

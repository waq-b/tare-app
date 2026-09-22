import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconTile } from '../IconTile/IconTile';
import { Tag } from '../Tag/Tag';
import { ListRow } from './ListRow';

const meta = {
  title: 'Components/Structure/ListRow',
  component: ListRow,
  args: { title: 'Gym kit' },
} satisfies Meta<typeof ListRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Nav: Story = {
  args: { leading: <Icon name="dumbbell" size={22} />, value: '11 items', href: '#' },
};
export const History: Story = {
  args: { title: 'Session B · Push + pull', subtitle: 'Tue 15 Sep · 57 min · 2 PRs', href: '#' },
};
export const Option: Story = {
  args: {
    variant: 'option',
    title: 'Import a file',
    subtitle: 'Export from your food app, then pick the file',
    leading: (
      <IconTile size={40}>
        <Icon name="download" size={20} />
      </IconTile>
    ),
    trailing: <Tag tone="accent">Suggested</Tag>,
    onClick: () => undefined,
  },
};
export const OptionDisabled: Story = {
  args: {
    variant: 'option',
    title: 'Apple Health / Health Connect',
    subtitle: 'Coming later',
    disabled: true,
    onClick: () => undefined,
  },
};
export const KeyValue: Story = {
  render: () => (
    <div>
      <ListRow title="Last successful run" value="Sun 13 Sep, 19:02" valueMono />
      <ListRow title="Missed" value="Sun 20 Sep" valueMono valueTone="warning" />
      <ListRow title="Connection" value="OK" valueTone="progress" />
    </div>
  ),
};
export const Compact: Story = {
  args: {
    variant: 'compact',
    title: 'Bench press: remaining sets',
    leading: <Icon name="minus" size={18} />,
  },
};

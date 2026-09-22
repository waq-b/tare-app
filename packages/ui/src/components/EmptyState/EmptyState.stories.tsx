import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { ListRow } from '../ListRow/ListRow';
import { StepProgress } from '../StepProgress/StepProgress';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Components/Feedback/EmptyState',
  component: EmptyState,
  args: { icon: <Icon name="chart" size={30} />, title: 'Nothing to chart yet' },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Centred: Story = {
  args: {
    children: 'Trends need a few sessions. Log one to start.',
    actions: <Button variant="secondary">Go to Today</Button>,
  },
};
export const NotEnoughData: Story = {
  args: {
    layout: 'left',
    icon: <Icon name="coach" size={28} />,
    title: 'Not enough data yet.',
    children: 'Your coach starts after 4 weeks of logs. Until then, the rules run on their own.',
    extra: (
      <StepProgress
        total={4}
        done={2}
        current={2}
        label="Week 3 of 4"
        labels={['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']}
      />
    ),
  },
};
export const MissedRun: Story = {
  args: {
    layout: 'left',
    icon: <Icon name="refresh" size={28} />,
    title: 'No review this week.',
    children: 'The scheduled review didn’t run.',
    extra: (
      <div>
        <ListRow title="Last successful run" value="Sun 13 Sep, 19:02" valueMono />
        <ListRow title="Missed" value="Sun 20 Sep" valueMono valueTone="warning" />
      </div>
    ),
    actions: (
      <>
        <Button icon={<Icon name="copy" size={20} />}>Copy prompt to run it in Claude</Button>
        <Button variant="secondary-outline">Check connection</Button>
      </>
    ),
  },
};
export const WithOptions: Story = {
  args: {
    layout: 'left',
    icon: <Icon name="food" size={28} />,
    title: 'Connect your food log',
    extra: (
      <ListRow
        variant="option"
        title="Import a file"
        subtitle="Export from your food app"
        onClick={() => undefined}
      />
    ),
  },
};

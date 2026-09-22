import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = { title: 'Components/Feedback/Skeleton', component: Skeleton } satisfies Meta<
  typeof Skeleton
>;
export default meta;
export const Shapes: StoryObj<typeof meta> = {
  render: () => (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading today's session"
      style={{ display: 'grid', gap: 12 }}
    >
      <Skeleton shape="line" width="55%" />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton shape="tile" />
        <div style={{ flex: 1, display: 'grid', gap: 6 }}>
          <Skeleton width="60%" />
          <Skeleton width="30%" height={10} />
        </div>
      </div>
      <Skeleton shape="block" />
    </div>
  ),
};

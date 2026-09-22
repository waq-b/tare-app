// Stories for the @tare/icons components used throughout the UI.
import { Icon, MuscleMap, PatternIcon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = { title: 'Components/Icons' } satisfies Meta;
export default meta;

export const IconStory: StoryObj = {
  name: 'Icon',
  render: () => <Icon name="flag" size={28} title="Flag pain" />,
};
export const PatternIconStory: StoryObj = {
  name: 'PatternIcon',
  render: () => <PatternIcon pattern="hinge" size={36} title="Hinge" />,
};
export const MuscleMapStory: StoryObj = {
  name: 'MuscleMap',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <MuscleMap
        view="front"
        primary={['chest']}
        secondary={['shoulders', 'triceps']}
        width={64}
        title="Bench press, front"
      />
      <MuscleMap
        view="back"
        primary={['chest']}
        secondary={['shoulders', 'triceps']}
        width={64}
        title="Bench press, back"
      />
    </div>
  ),
};

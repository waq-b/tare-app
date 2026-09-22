import type { Meta, StoryObj } from '@storybook/react-vite';
import { DisclaimerCard, EmergencyShortcut, IconList, RemovedItemList } from './SafetyBits';

const meta = { title: 'Components/Safety/SafetyBits' } satisfies Meta;
export default meta;

export const EmergencyShortcutStory: StoryObj = {
  name: 'EmergencyShortcut',
  render: () => <EmergencyShortcut label="Chest pain, or struggling to breathe?" href="#" />,
};
export const IconListStory: StoryObj = {
  name: 'IconList',
  render: () => (
    <IconList
      items={[
        { icon: 'check', text: 'Progression rules run after every session' },
        { icon: 'check', text: 'Deloads are planned every few weeks' },
        { icon: 'shield', text: 'Pain flags go through the safety rules' },
      ]}
    />
  ),
};
export const RemovedItemListStory: StoryObj = {
  name: 'RemovedItemList',
  render: () => (
    <RemovedItemList
      label="Skipped today"
      items={['OHP: remaining sets', 'Incline DB press', 'Lateral raise']}
    />
  ),
};
export const DisclaimerCardStory: StoryObj = {
  name: 'DisclaimerCard',
  render: () => (
    <DisclaimerCard title="Not medical advice">
      Tare helps you plan and log training. It can’t diagnose anything. If something feels wrong,
      the safety rules will point you to the NHS.
    </DisclaimerCard>
  ),
};

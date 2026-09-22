import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Switch, ToggleRow } from './Switch';

const meta = {
  title: 'Components/Inputs/Switch',
  component: Switch,
  args: { label: 'Rest timer', checked: true },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = { args: { checked: false } };
export const Locked: Story = { args: { label: 'Safety follow-ups', locked: true } };
export const Disabled: Story = { args: { label: 'Ride nudges', checked: false, disabled: true } };

export const Rows: Story = {
  render: function Render() {
    const [rest, setRest] = useState(true);
    return (
      <div>
        <ToggleRow
          title="Rest timer"
          description="Buzz and banner when rest ends"
          checked={rest}
          onChange={setRest}
        />
        <ToggleRow
          title="Safety follow-ups"
          description="Checks in after a pain flag. Always on."
          checked
          locked
        />
        <ToggleRow title="Ride nudges" description="Coming later" checked={false} disabled />
      </div>
    );
  },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const rest = c.getByRole('switch', { name: 'Rest timer' });
    await userEvent.click(rest);
    await expect(rest).not.toBeChecked();
    await expect(c.getByRole('switch', { name: 'Safety follow-ups (always on)' })).toBeDisabled();
  },
};

export const ToggleRowStory: Story = {
  name: 'ToggleRow',
  render: () => (
    <ToggleRow
      title="Weekly review ready"
      description="When your Claude has written it"
      checked
      onChange={() => undefined}
    />
  ),
};

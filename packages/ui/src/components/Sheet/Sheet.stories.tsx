import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Sheet } from './Sheet';

const meta = {
  title: 'Components/Structure/Sheet',
  component: Sheet,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    title: 'Sheet title',
    onClose: fn(),
    children: (
      <p style={{ margin: 0 }}>Grabber, title, close. Rises from the bottom; scrim behind.</p>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
export const WithFooter: Story = { args: { footer: <Button fullWidth>Save</Button> } };

/** Escape closes; Tab stays inside the sheet. One theme, because focus is global. */
export const KeyboardBehaviour: Story = {
  globals: { theme: 'dark' },
  args: { footer: <Button fullWidth>Save</Button> },
  play: async ({ args, canvasElement }) => {
    const [dialog] = within(canvasElement).getAllByRole('dialog');
    const d = within(dialog as HTMLElement);
    const close = d.getByRole('button', { name: 'Close' });
    const save = d.getByRole('button', { name: 'Save' });
    await expect(close).toHaveFocus();
    await userEvent.tab();
    await expect(save).toHaveFocus();
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const OpenAndClose: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 16 }}>
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        <Sheet open={open} title="Edit set 2" onClose={() => setOpen(false)}>
          <p style={{ margin: 0 }}>Content</p>
        </Sheet>
      </div>
    );
  },
};

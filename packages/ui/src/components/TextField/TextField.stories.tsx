import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextField, type TextFieldProps } from './TextField';

function Controlled(props: Omit<TextFieldProps, 'value' | 'onChange'> & { initial?: string }) {
  const { initial = '', ...rest } = props;
  const [value, setValue] = useState(initial);
  return <TextField {...rest} value={value} onChange={setValue} />;
}

const meta = {
  title: 'Components/Inputs/TextField',
  component: TextField,
  args: { label: 'Email', value: '', onChange: () => {} },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Email: Story = {
  render: () => (
    <Controlled label="Email" type="email" autoComplete="email" placeholder="you@example.com" />
  ),
};
export const WithHint: Story = {
  render: () => (
    <Controlled
      label="Email"
      type="email"
      initial="test@example.com"
      hint="Invite-only for now. No password: we email you a code."
    />
  ),
};
export const SignInCode: Story = {
  render: () => (
    <Controlled
      label="Code"
      variant="code"
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="00000000"
      initial="1234"
    />
  ),
};
export const WithError: Story = {
  render: () => (
    <Controlled
      label="Code"
      variant="code"
      inputMode="numeric"
      initial="12345678"
      error="That code didn’t work. Check it’s from the newest email, or send a new code."
    />
  ),
};

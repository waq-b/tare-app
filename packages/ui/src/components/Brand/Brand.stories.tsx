import type { Meta, StoryObj } from '@storybook/react-vite';
import { MiniquestPip, MiniquestTag, Wordmark } from './Brand';

const meta = { title: 'Components/Brand' } satisfies Meta;
export default meta;

export const WordmarkDefault: StoryObj = { name: 'Wordmark', render: () => <Wordmark /> };
export const WordmarkSmall: StoryObj = {
  name: 'Wordmark · small, no badge',
  render: () => <Wordmark size={34} badge={false} />,
};
export const Tag: StoryObj = { name: 'MiniquestTag', render: () => <MiniquestTag /> };
export const Pip: StoryObj = { name: 'MiniquestPip', render: () => <MiniquestPip size={25} /> };

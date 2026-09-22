import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, type Tone } from './Tag';

const meta = {
  title: 'Components/Feedback/Tag',
  component: Tag,
  args: { children: 'OK' },
} satisfies Meta<typeof Tag>;
export default meta;
type Story = StoryObj<typeof meta>;

const tones: Tone[] = [
  'neutral',
  'accent',
  'progress',
  'hold',
  'deload',
  'swap',
  'warning',
  'safety',
];
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {tones.map((t) => (
        <Tag key={t} tone={t}>
          {t}
        </Tag>
      ))}
      <Tag tone="accent" fill="solid">
        Chosen
      </Tag>
    </div>
  ),
};
export const Effort: Story = { args: { children: 'Hard' } };
export const PR: Story = { args: { children: 'PR', tone: 'accent' } };
export const BestMatch: Story = { args: { children: 'Best match', tone: 'swap' } };
export const Active: Story = { args: { children: 'Active', tone: 'safety' } };

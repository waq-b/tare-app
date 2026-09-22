import { rule } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { IncrementChips } from './IncrementChips';

// Deltas from pr.double_progression's typical upper-body increments (both directions).
const typical = (
  rule('pr.double_progression').raw['increment_kg_typical'] as { upper: [number, number] }
).upper;
const deltas = [-typical[1] * 2, -typical[1], typical[1], typical[1] * 2];

const meta = {
  title: 'Components/Inputs/IncrementChips',
  component: IncrementChips,
  args: { deltas, onApply: fn() },
} satisfies Meta<typeof IncrementChips>;
export default meta;
export const UpperBody: StoryObj<typeof meta> = {};

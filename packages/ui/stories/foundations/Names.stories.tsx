// Board: Names.dc.html. Only the chosen name is built; the other four stay on the canvas.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MiniquestTag, Wordmark } from '../../src/components/Brand/Brand';
import s from './foundations.module.css';

const meta = { title: 'Brand/Names' } satisfies Meta;
export default meta;

export const Names: StoryObj = {
  render: () => (
    <div className={s['page']}>
      <Wordmark size={64} />
      <p className={s['lede']}>
        Tare: zeroing the scale before you weigh. An honest reading with nothing added. Sibling, not
        clone: every miniquest app keeps the family’s pixel pip and “a miniquest” tag, but gets its
        own face.
      </p>
      <MiniquestTag />
    </div>
  ),
};

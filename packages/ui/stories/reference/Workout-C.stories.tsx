// Reference only (decision 15): the chosen direction is Ledger (Workout-A). Nothing is built.
import type { Meta, StoryObj } from '@storybook/react-vite';
import s from '../foundations/foundations.module.css';

const meta = { title: 'Reference/Workout-C' } satisfies Meta;
export default meta;

export const NotBuilt: StoryObj = {
  name: 'Not built',
  render: () => (
    <div className={s['note']}>
      <h2 className={s['h2']}>C · Dial: reference only</h2>
      <p className={s['lede']}>
        This active-workout direction was explored on the canvas and not chosen. The app uses Ledger
        (Workout-A). See design/canvas/Workout-C.dc.html.
      </p>
    </div>
  ),
};

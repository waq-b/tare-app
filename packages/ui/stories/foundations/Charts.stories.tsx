// Board: Charts.dc.html. The chart rules and series colours; the charts themselves arrive in T9.
import { cssVar } from '@tare/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import s from './foundations.module.css';

const meta = { title: 'Foundations/Charts' } satisfies Meta;
export default meta;

const RULES = [
  'One series? Use lume and no legend; the title names it. Two or more get a legend and direct labels.',
  'Series colours are only for categories like macros. They never mean good or bad; semantic colours do that, always with a label.',
  'One y-axis, ever. Weight and strength sit in two charts, stacked, never on a dual axis.',
  'Every chart has a table view one tap away. That’s the accessible version and the export.',
  'Show estimates as estimates: e1RM says “estimated”, food says “imported”.',
];

export const Charts: StoryObj = {
  render: () => (
    <div className={s['page']}>
      <section>
        <h2 className={s['h2']}>Rules</h2>
        <ol className={s['lede']}>
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className={s['h2']}>
          Series (categories only; light 2 and 3 are always direct-labelled)
        </h2>
        <div className={s['grid']}>
          {(['series-1', 'series-2', 'series-3'] as const).map((c) => (
            <div key={c} className={s['swatch']}>
              <span className={s['chip']} style={{ background: cssVar(c) }} />
              <span className={s['mono']}>--{c}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};

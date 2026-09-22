// Board: Icons.dc.html. Every icon from @tare/icons; muscle maps from real exercise data.
import { exercise, displayName } from '@tare/data';
import {
  Icon,
  iconNames,
  movementPatterns,
  MuscleMap,
  muscles,
  PatternIcon,
  patternsWithoutGlyph,
  type Muscle,
} from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import s from './foundations.module.css';

const meta = { title: 'Foundations/Icons' } satisfies Meta;
export default meta;

const asMuscles = (xs: readonly string[]) =>
  xs.filter((m): m is Muscle => (muscles as readonly string[]).includes(m));
const LIFTS = [
  'Barbell_Squat',
  'Barbell_Bench_Press_-_Medium_Grip',
  'Wide-Grip_Lat_Pulldown',
  'Barbell_Deadlift',
];

export const Icons: StoryObj = {
  render: () => (
    <div className={s['page']}>
      <section>
        <h2 className={s['h2']}>Interface icons ({iconNames.length})</h2>
        <div
          className={s['grid']}
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))' }}
        >
          {iconNames.map((n) => (
            <div key={n} className={s['iconCell']}>
              <Icon name={n} size={26} />
              <span className={s['mono']}>{n}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className={s['h2']}>Movement patterns (vpt enum; * = no canvas drawing yet)</h2>
        <div
          className={s['grid']}
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
        >
          {movementPatterns.map((p) => (
            <div key={p} className={s['iconCell']}>
              <PatternIcon pattern={p} size={36} />
              <span className={s['mono']}>
                {p}
                {(patternsWithoutGlyph as readonly string[]).includes(p) ? ' *' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className={s['h2']}>Muscle map: primary, secondary at 40% (from exercises.json)</h2>
        <div className={s['flex']}>
          {LIFTS.map((id) => {
            const ex = exercise(id);
            const primary = asMuscles(ex.primary_muscles);
            const secondary = asMuscles(ex.secondary_muscles);
            return (
              <figure key={id} className={s['iconCell']} style={{ margin: 0 }}>
                <div className={s['flex']} style={{ gap: 8 }}>
                  <MuscleMap
                    view="front"
                    primary={primary}
                    secondary={secondary}
                    width={52}
                    title={`${displayName(ex)}, front`}
                  />
                  <MuscleMap
                    view="back"
                    primary={primary}
                    secondary={secondary}
                    width={52}
                    title={`${displayName(ex)}, back`}
                  />
                </div>
                <figcaption>{displayName(ex)}</figcaption>
              </figure>
            );
          })}
        </div>
      </section>
    </div>
  ),
};

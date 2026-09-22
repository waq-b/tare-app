// Board: Session-Detail. The last logged Session B.
import { exercise } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { e1rm, sessions, shortDate } from '../../fixtures';
import { SessionExerciseBlock } from '../../src/components/SessionExerciseBlock/SessionExerciseBlock';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { name } from './data';
import { ScreenBody, ScreenFrame } from './Screen';

const meta = { title: 'Screens/History', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;

const session = sessions.filter((x) => x.sessionId === 'B').at(-1)!;
const before = sessions.filter((x) => x.date < session.date);
const bestBefore = (id: string) =>
  Math.max(
    0,
    ...before.flatMap((x) =>
      x.exercises
        .filter((e) => e.exerciseId === id)
        .flatMap((e) =>
          e.sets.filter((w) => w.kind === 'work').map((w) => e1rm(w.load, w.reps) ?? 0),
        ),
    ),
  );
const EFFORT = { easy: 'Easy', ok: 'OK', hard: 'Hard' } as const;

export const Session: StoryObj = {
  render: () => (
    <ScreenFrame>
      <TopBar
        back={{ href: '#' }}
        title="Session B"
        subtitle={`${shortDate(session.date)} · ${session.durationMin} min · felt ${session.feel}`}
      />
      <ScreenBody gap={0}>
        {session.exercises.map((ex) => {
          const work = ex.sets.filter((w) => w.kind === 'work');
          const best = Math.max(...work.map((w) => e1rm(w.load, w.reps) ?? 0));
          const hardest = work.some((w) => w.effort === 'hard')
            ? 'hard'
            : work.some((w) => w.effort === 'ok')
              ? 'ok'
              : 'easy';
          return (
            <SessionExerciseBlock
              key={ex.exerciseId}
              name={name(ex.exerciseId)}
              sets={work.map((w) => ({ load: w.load, reps: w.reps }))}
              loadConvention={exercise(ex.exerciseId).load_convention}
              effort={EFFORT[hardest]}
              pr={best > bestBefore(ex.exerciseId)}
              as="h2"
            />
          );
        })}
      </ScreenBody>
    </ScreenFrame>
  ),
};

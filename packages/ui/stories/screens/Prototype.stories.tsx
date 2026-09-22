// Board: Flow (the clickable prototype). State lives in the story; components stay pure.
import { displayName, exercise, goal, rule } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { profile, review } from '../../fixtures';
import { Banner } from '../../src/components/Banner/Banner';
import { BottomNav } from '../../src/components/BottomNav/BottomNav';
import { Button } from '../../src/components/Button/Button';
import { ChangeCard, type DecisionState } from '../../src/components/ChangeCard/ChangeCard';
import {
  EffortTap,
  type SessionFeel,
  type SetEffort,
} from '../../src/components/EffortTap/EffortTap';
import { ExerciseCard } from '../../src/components/ExerciseCard/ExerciseCard';
import { ExerciseHeader } from '../../src/components/ExerciseHeader/ExerciseHeader';
import { Prescription } from '../../src/components/Prescription/Prescription';
import { RestTimer } from '../../src/components/RestTimer/RestTimer';
import { SectionHeader } from '../../src/components/SectionHeader/SectionHeader';
import { SessionHeader } from '../../src/components/SessionHeader/SessionHeader';
import { SetRow } from '../../src/components/SetRow/SetRow';
import { Sheet } from '../../src/components/Sheet/Sheet';
import { StatTile } from '../../src/components/Charts/Stats';
import { StepProgress } from '../../src/components/StepProgress/StepProgress';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { WeekStrip } from '../../src/components/WeekStrip/WeekStrip';
import { WorkoutFooter } from '../../src/components/WorkoutFooter/WorkoutFooter';
import { WorkoutTopBar } from '../../src/components/WorkoutTopBar/WorkoutTopBar';
import { clock, num } from '../../src/lib/format';
import { bench, lastTime, musclesLine, name, pattern, sessionB, thisWeek, todayList } from './data';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Prototype', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;

const [, REST] = goal(profile.goalId)['rest_seconds'] as [number, number];
const CHANGES = review.changes.filter((c) => c.kind === 'progress');
const EFFORT_LABEL = { easy: 'Easy', ok: 'OK', hard: 'Hard' } as const;

function Flow() {
  const [screen, setScreen] = useState<'today' | 'workout' | 'finish' | 'review'>('today');
  const [done, setDone] = useState(0);
  const [efforts, setEfforts] = useState<Record<number, SetEffort>>({});
  const [resting, setResting] = useState(false);
  const [rest, setRest] = useState(REST);
  const [secs, setSecs] = useState(0);
  const [feel, setFeel] = useState<SessionFeel | null>(null);
  const [dec, setDec] = useState<Record<string, DecisionState>>(
    Object.fromEntries(CHANGES.map((c) => [c.id, 'pending'])),
  );

  // The prototype's clock: elapsed time and the rest countdown.
  useEffect(() => {
    if (screen !== 'workout') return;
    const t = setInterval(() => {
      setSecs((x) => x + 1);
      if (resting) setRest((r) => (r <= 1 ? (setResting(false), REST) : r - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [screen, resting]);

  const log = () => {
    if (done >= bench.sets) return;
    setDone(done + 1);
    setRest(REST);
    setResting(true);
  };
  const reset = () => {
    setScreen('today');
    setDone(0);
    setEfforts({});
    setResting(false);
    setSecs(0);
    setFeel(null);
    setDec(Object.fromEntries(CHANGES.map((c) => [c.id, 'pending'])));
  };

  if (screen === 'today') {
    return (
      <ScreenFrame>
        <TopBar title="Today" subtitle="Tuesday 22 September" />
        <ScreenBody gap={16}>
          <WeekStrip days={thisWeek()} />
          <SessionHeader title={sessionB.name} duration="~60 min" />
          <div>
            {todayList.map((e) => (
              <ExerciseCard
                key={e.exerciseId}
                name={name(e.exerciseId)}
                pattern={pattern(e.exerciseId)}
                prescription={<Prescription rx={e.rx} />}
              />
            ))}
          </div>
          <Button
            size={64}
            fullWidth
            icon={<Icon name="play" size={20} />}
            onClick={() => setScreen('workout')}
          >
            Start workout
          </Button>
        </ScreenBody>
        <BottomNav active="today" />
      </ScreenFrame>
    );
  }

  if (screen === 'workout') {
    const last = lastTime(bench.exerciseId);
    const allDone = done >= bench.sets;
    return (
      <ScreenFrame>
        <WorkoutTopBar sessionName={sessionB.name} elapsed={clock(secs)} onMinimise={reset} />
        <ScreenBody gap={14}>
          <StepProgress
            total={sessionB.exercises.length}
            done={0}
            current={0}
            tone="text"
            label={`Exercise 1 of ${sessionB.exercises.length}`}
          />
          <ExerciseHeader
            name={name(bench.exerciseId)}
            muscles={musclesLine(bench.exerciseId)}
            pattern={pattern(bench.exerciseId)}
          />
          <div className={s['stack']}>
            {Array.from({ length: bench.sets }, (_, i) => (
              <SetRow
                key={i}
                state={i < done ? 'done' : i === done ? 'current' : 'upcoming'}
                index={i + 1}
                load={bench.load}
                reps={bench.reps}
                {...(efforts[i + 1] ? { effort: EFFORT_LABEL[efforts[i + 1]!] } : {})}
                lastTime={last.target}
                onCheck={i === done ? log : () => undefined}
              />
            ))}
          </div>
        </ScreenBody>
        <WorkoutFooter
          actionLabel={allDone ? 'Finish workout' : 'Done'}
          {...(allDone ? {} : { actionValue: `${num(bench.load)} × ${bench.reps}` })}
          onAction={allDone ? () => setScreen('finish') : log}
        />
        <Sheet open={resting} title="Rest" onClose={() => setResting(false)}>
          <RestTimer
            remaining={rest}
            total={REST}
            next={
              allDone
                ? `${name(todayList[1]!.exerciseId)} · ${todayList[1]!.rx}`
                : `set ${done + 1} · ${num(bench.load)} × ${bench.reps}`
            }
            onAdjust={(d) => setRest(Math.min(300, Math.max(1, rest + d)))}
            onSkip={() => setResting(false)}
          />
          <EffortTap
            scale="set"
            question={`How was set ${done}?`}
            value={efforts[done] ?? null}
            onChange={(v) => setEfforts({ ...efforts, [done]: v })}
          />
        </Sheet>
      </ScreenFrame>
    );
  }

  if (screen === 'finish') {
    return (
      <ScreenFrame>
        <ScreenBody gap={20}>
          <h1 className={s['h1']} style={{ paddingTop: 32 }}>
            Session done.
          </h1>
          <div className={s['grid3']}>
            <StatTile label="Time" value={String(Math.max(1, Math.round(secs / 60)))} unit="min" />
            <StatTile label="Bench vol." value={String(bench.load * bench.reps * done)} unit="kg" />
            <StatTile label="Sets" value={String(done)} />
          </div>
          <EffortTap
            scale="session"
            question="How did the session feel?"
            value={feel}
            onChange={setFeel}
          />
          <Button size={60} fullWidth onClick={() => setScreen('review')}>
            Skip to Sunday’s review
          </Button>
        </ScreenBody>
      </ScreenFrame>
    );
  }

  const allDecided = Object.values(dec).every((d) => d !== 'pending');
  return (
    <ScreenFrame>
      <TopBar title="Coach" subtitle="Weekly review" />
      <ScreenBody gap={14}>
        <SectionHeader
          title="Proposed changes"
          meta={
            allDecided
              ? 'All decided'
              : `${Object.values(dec).filter((d) => d === 'pending').length} left to decide`
          }
        />
        {CHANGES.map((c) => (
          <ChangeCard
            key={c.id}
            kind={c.kind}
            exercise={displayName(exercise(c.exerciseId))}
            from={c.from}
            to={c.to}
            rationale={c.rationale}
            rules={c.ruleIds.map((r) => rule(r))}
            state={dec[c.id]!}
            onAccept={() => setDec({ ...dec, [c.id]: 'accepted' })}
            onKeep={() => setDec({ ...dec, [c.id]: 'kept' })}
            onUndo={() => setDec({ ...dec, [c.id]: 'pending' })}
          />
        ))}
        {allDecided ? (
          <>
            <Banner tone="success" title="Plan updated">
              Accepted changes apply from your next session.
            </Banner>
            <Button variant="secondary" size={60} fullWidth onClick={reset}>
              Back to Today
            </Button>
          </>
        ) : null}
      </ScreenBody>
      <BottomNav active="coach" />
    </ScreenFrame>
  );
}

export const TodayToReview: StoryObj = { name: 'Today → review', render: () => <Flow /> };

/** Walks the whole loop: start, log three sets, finish, decide both changes. */
export const WalkThrough: StoryObj = {
  name: 'Today → review · walk-through',
  globals: { theme: 'dark' },
  render: () => <Flow />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Start workout' }));
    for (let i = 1; i <= 3; i++) {
      await userEvent.click(c.getByRole('button', { name: `Mark set ${i} done as planned` }));
      await expect(c.getByRole('dialog', { name: 'Rest' })).toBeInTheDocument();
      if (i === 1) await userEvent.click(c.getByRole('radio', { name: 'OK' }));
      await userEvent.click(c.getByRole('button', { name: 'Skip' }));
    }
    // Set 1's effort tag shows in its row once the rest sheet has closed.
    await expect(c.getByText('OK')).toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: /Finish workout/ }));
    await userEvent.click(c.getByRole('radio', { name: 'Good' }));
    await userEvent.click(c.getByRole('button', { name: /Sunday’s review/ }));
    const accepts = c.getAllByRole('button', { name: /^Accept/ });
    await userEvent.click(accepts[0]!);
    await userEvent.click(c.getAllByRole('button', { name: /^Keep as is/ })[0]!);
    await expect(c.getByText('Plan updated')).toBeInTheDocument();
  },
};

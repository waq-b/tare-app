// Boards: Workout-A (Ledger), Workout-A-Light, Workout-A-Edit, Rest-Timer, Swap-Sheet, Offline-Workout.
import { goal, rule } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { profile } from '../../fixtures';
import { Banner } from '../../src/components/Banner/Banner';
import { Button } from '../../src/components/Button/Button';
import { Checkbox } from '../../src/components/Checkbox/Checkbox';
import { EffortTap, type SetEffort } from '../../src/components/EffortTap/EffortTap';
import { ExerciseHeader } from '../../src/components/ExerciseHeader/ExerciseHeader';
import { IncrementChips } from '../../src/components/IncrementChips/IncrementChips';
import { LastTimeStrip } from '../../src/components/LastTimeStrip/LastTimeStrip';
import { NumberStepper } from '../../src/components/NumberStepper/NumberStepper';
import { RestTimer } from '../../src/components/RestTimer/RestTimer';
import { SetRow, type SetRowState } from '../../src/components/SetRow/SetRow';
import { Sheet } from '../../src/components/Sheet/Sheet';
import { StepProgress } from '../../src/components/StepProgress/StepProgress';
import { SwapRow } from '../../src/components/SwapRow/SwapRow';
import { WorkoutFooter } from '../../src/components/WorkoutFooter/WorkoutFooter';
import { WorkoutTopBar } from '../../src/components/WorkoutTopBar/WorkoutTopBar';
import { num } from '../../src/lib/format';
import {
  bench,
  benchWarmups,
  lastTime,
  musclesLine,
  name,
  pattern,
  sessionB,
  swapStart,
  swapsFor,
  todayList,
} from './data';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Workout', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const last = lastTime(bench.exerciseId);
const next = todayList[1]!;
const [, restMax] = goal(profile.goalId)['rest_seconds'] as [number, number];
const typical = (
  rule('pr.double_progression').raw['increment_kg_typical'] as { upper: [number, number] }
).upper[1];

/** The Ledger: one exercise, its sets, one big Done. `done` = working sets logged. */
function Ledger({
  done,
  sheet,
  banner,
  docked,
}: {
  done: number;
  sheet?: ReactNode;
  banner?: ReactNode;
  docked?: ReactNode;
}) {
  const [logged, setLogged] = useState(done);
  const state = (i: number): SetRowState =>
    i < logged ? 'done' : i === logged ? 'current' : 'upcoming';
  const current = Math.min(logged, bench.sets - 1) + 1;
  return (
    <ScreenFrame>
      <WorkoutTopBar
        sessionName={sessionB.name}
        elapsed="12:40"
        minimiseHref="#"
        flagPainHref="#"
      />
      <ScreenBody gap={14}>
        {banner}
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
          swapHref="#"
        />
        <LastTimeStrip sets={last.sets} date={last.date} effort={last.effort} />
        <div className={s['stack']}>
          {benchWarmups.map((w, i) => (
            <SetRow key={`w${i}`} state="warmup" index={i + 1} load={w.load} reps={w.reps} />
          ))}
          {Array.from({ length: bench.sets }, (_, i) => (
            <SetRow
              key={i}
              state={state(i)}
              index={i + 1}
              load={bench.load}
              reps={bench.reps}
              effort="OK"
              lastTime={last.target}
              onCheck={() => setLogged(i < logged ? i : i + 1)}
            />
          ))}
          <div className={s['ghostRow']}>
            <Button variant="ghost" size={44} icon={<Icon name="plus" size={18} />}>
              Add set
            </Button>
            <Button variant="ghost" size={44} icon={<Icon name="skip" size={18} />}>
              Skip set
            </Button>
            <Button variant="ghost" size={44} icon={<Icon name="edit" size={18} />}>
              Edit set {current}
            </Button>
          </div>
        </div>
      </ScreenBody>
      <WorkoutFooter
        actionLabel={logged >= bench.sets ? 'Next exercise' : 'Done'}
        {...(logged < bench.sets ? { actionValue: `${num(bench.load)} × ${bench.reps}` } : {})}
        onAction={() => setLogged(Math.min(bench.sets, logged + 1))}
        next={{ name: name(next.exerciseId), rx: next.rx }}
        docked={docked}
      />
      {sheet}
    </ScreenFrame>
  );
}

export const LedgerStory: Story = {
  name: 'Ledger',
  render: () => <Ledger done={1} />,
};

export const LedgerLight: Story = {
  name: 'Ledger (light)',
  globals: { theme: 'light' },
  render: () => <Ledger done={1} />,
};

/** One tap on the current set's check logs it as planned. */
export const LogOneTap: Story = {
  name: 'Ledger · log a set',
  globals: { theme: 'dark' },
  render: () => <Ledger done={1} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Mark set 2 done as planned' }));
    await expect(c.getByRole('button', { name: 'Set 2 done, undo' })).toBeInTheDocument();
  },
};

function EditSheet() {
  const [load, setLoad] = useState(bench.load);
  const [reps, setReps] = useState(bench.reps - 1);
  const [carry, setCarry] = useState(false);
  return (
    <Sheet
      open
      title="Edit set 2"
      onClose={() => undefined}
      footer={
        <>
          <Button variant="secondary" size={60}>
            Save
          </Button>
          <Button size={60} fullWidth value={`${num(load)} × ${reps}`}>
            Log
          </Button>
        </>
      }
    >
      <p className={s['lede']}>
        Plan {num(bench.load)} × {bench.reps} · last time {last.target.replace('×', ' × ')}
      </p>
      <NumberStepper label="Weight" value={load} step={typical} unit="kg" onChange={setLoad} />
      <IncrementChips
        deltas={[-typical * 2, -typical, typical, typical * 2]}
        onApply={(d) => setLoad(Math.max(0, load + d))}
      />
      <NumberStepper label="Reps" value={reps} step={1} onChange={setReps} />
      <Checkbox label={`Use ${num(load)} kg for set 3 too`} checked={carry} onChange={setCarry} />
    </Sheet>
  );
}
export const EditSet: Story = {
  name: 'Ledger · Edit set',
  render: () => <Ledger done={1} sheet={<EditSheet />} />,
};

function RestSheet() {
  const [left, setLeft] = useState(92);
  const [effort, setEffort] = useState<SetEffort | null>('ok');
  return (
    <Sheet open title="Rest" onClose={() => undefined}>
      <RestTimer
        remaining={left}
        total={restMax}
        next={`set 3 · ${num(bench.load)} × ${bench.reps}`}
        onAdjust={(d) => setLeft(Math.max(0, left + d))}
      />
      <EffortTap scale="set" question="How was set 2?" value={effort} onChange={setEffort} />
    </Sheet>
  );
}
export const RestTimerStory: Story = {
  name: 'Rest timer',
  render: () => <Ledger done={2} sheet={<RestSheet />} />,
};

function SwapSheet() {
  const options = swapsFor(bench.exerciseId);
  const [pick, setPick] = useState(options[0]?.id);
  return (
    <Sheet
      open
      height="tall"
      title={`Swap ${name(bench.exerciseId).toLowerCase()}`}
      onClose={() => undefined}
      footer={
        <>
          <Button variant="secondary" size={60} fullWidth>
            Swap in plan
          </Button>
          <Button size={60} fullWidth>
            Swap today
          </Button>
        </>
      }
    >
      <p className={s['lede']}>
        Best matches first, filtered to your kit. Starting weights are estimates.
      </p>
      <div className={s['stack']}>
        {options.map((o, i) => (
          <SwapRow
            key={o.id}
            rank={i + 1}
            best={i === 0}
            name={o.name}
            pattern={o.pattern}
            reason={o.reason}
            load={swapStart(bench.exerciseId, o.id, bench.load)}
            selected={pick === o.id}
            onSelect={() => setPick(o.id)}
          />
        ))}
      </div>
    </Sheet>
  );
}
export const SwapSheetStory: Story = {
  name: 'Swap sheet',
  render: () => <Ledger done={1} sheet={<SwapSheet />} />,
};

export const Offline: Story = {
  render: () => (
    <Ledger
      done={2}
      banner={
        <Banner tone="offline" title="Offline: logging still works">
          2 sets saved on this phone. They sync when you’re back online.
        </Banner>
      }
      docked={<RestTimer variant="docked" remaining={28} total={restMax} />}
    />
  ),
};

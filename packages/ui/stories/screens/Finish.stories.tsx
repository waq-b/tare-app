// Boards: Finish, Finish-Light, Finish-Sync-Failed. Today's Session B, done as planned.
import { exercise } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { e1rm, e1rmHistory, historyOf } from '../../fixtures';
import { Banner } from '../../src/components/Banner/Banner';
import { Button } from '../../src/components/Button/Button';
import { StatTile } from '../../src/components/Charts/Stats';
import { ComparisonRow } from '../../src/components/ComparisonRow/ComparisonRow';
import { EffortTap, type SessionFeel } from '../../src/components/EffortTap/EffortTap';
import { InlineNote } from '../../src/components/InlineNote/InlineNote';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { num } from '../../src/lib/format';
import { name, todayList } from './data';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Finish', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const sets = todayList.reduce((n, e) => n + e.sets, 0);
const volume = todayList.reduce(
  (v, e) =>
    v + e.sets * e.reps * e.load * (exercise(e.exerciseId).load_convention === 'per_hand' ? 2 : 1),
  0,
);

/** Improvements on last time: more load, or more reps at the same load. */
const better = todayList.flatMap((e) => {
  const lastWork = historyOf(e.exerciseId)
    .at(-1)
    ?.sets.filter((x) => x.kind === 'work')[0];
  if (!lastWork) return [];
  if (e.load > lastWork.load)
    return [
      {
        id: e.exerciseId,
        before: `${num(lastWork.load)} × ${lastWork.reps}`,
        after: `${num(e.load)} × ${e.reps}`,
        delta: `+${num(e.load - lastWork.load)} kg`,
      },
    ];
  if (e.load === lastWork.load && e.reps > lastWork.reps)
    return [
      {
        id: e.exerciseId,
        before: `${num(lastWork.load)} × ${lastWork.reps}`,
        after: `${num(e.load)} × ${e.reps}`,
        delta: `+${e.reps - lastWork.reps} rep`,
      },
    ];
  return [];
});

/** Best estimated 1RM today vs the best before, per tr.global.e1rm. Only real PRs show. */
const prs = todayList.flatMap((e) => {
  const today = e1rm(e.load, e.reps);
  const before = Math.max(0, ...e1rmHistory(e.exerciseId).map((p) => p.e1rm));
  return today != null && today > before ? [{ id: e.exerciseId, today, before }] : [];
});

function Finish({ sync }: { sync: ReactNode }) {
  const [feel, setFeel] = useState<SessionFeel | null>('good');
  return (
    <ScreenFrame>
      <ScreenBody gap={20}>
        <div style={{ paddingTop: 32 }} className={s['stack']}>
          <SectionLabel as="div">Tue 22 Sep · Session B</SectionLabel>
          <h1 className={s['h1']}>Session done.</h1>
        </div>
        <div className={s['grid3']}>
          <StatTile label="Time" value="58" unit="min" />
          <StatTile label="Volume" value={volume.toLocaleString('en-GB')} unit="kg" />
          <StatTile label="Sets" value={String(sets)} />
        </div>
        {prs.map((p) => (
          <Banner key={p.id} tone="pr" title={`${name(p.id)}: best estimated 1RM`}>
            {num(p.today)} kg (was {num(p.before)})
          </Banner>
        ))}
        {better.length ? (
          <div>
            <SectionLabel>Beat last time</SectionLabel>
            {better.map((b) => (
              <ComparisonRow
                key={b.id}
                name={name(b.id)}
                before={b.before}
                after={b.after}
                delta={b.delta}
              />
            ))}
          </div>
        ) : null}
        <EffortTap
          scale="session"
          question="How did the session feel?"
          value={feel}
          onChange={setFeel}
        />
        {sync}
        <Button size={60} fullWidth>
          Done
        </Button>
      </ScreenBody>
    </ScreenFrame>
  );
}

const synced = <InlineNote kind="synced">Synced · 19:42</InlineNote>;
export const Default: Story = { render: () => <Finish sync={synced} /> };
export const DefaultLight: Story = {
  name: 'Default (light)',
  globals: { theme: 'light' },
  render: () => <Finish sync={synced} />,
};
export const SyncFailed: Story = {
  name: 'Sync failed',
  render: () => (
    <Finish
      sync={
        <Banner
          tone="unsynced"
          title="Couldn’t sync yet"
          icon="cloud-off"
          action={
            <Button variant="secondary-outline" size={44} icon={<Icon name="refresh" size={18} />}>
              Retry
            </Button>
          }
        >
          This session is saved on your phone. It syncs when you’re back online.
        </Banner>
      }
    />
  ),
};

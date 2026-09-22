// Boards: Main, Today-Light, Today-Rest, Deload-Today, Sync-Failed, Loading.
import { rule, vpt } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { deloadSets, plannedSession, sessions } from '../../fixtures';
import { Banner } from '../../src/components/Banner/Banner';
import { BottomNav } from '../../src/components/BottomNav/BottomNav';
import { Button } from '../../src/components/Button/Button';
import { Card } from '../../src/components/Card/Card';
import { DiffChip } from '../../src/components/DiffChip/DiffChip';
import { ExerciseCard, ExerciseCardSkeleton } from '../../src/components/ExerciseCard/ExerciseCard';
import { IconButton } from '../../src/components/IconButton/IconButton';
import { InlineNote } from '../../src/components/InlineNote/InlineNote';
import { PlaceholderAction } from '../../src/components/PlaceholderAction/PlaceholderAction';
import { Prescription } from '../../src/components/Prescription/Prescription';
import { RuleCitation } from '../../src/components/RuleCitation/RuleCitation';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { SessionHeader } from '../../src/components/SessionHeader/SessionHeader';
import { Skeleton } from '../../src/components/Skeleton/Skeleton';
import { StatusHero } from '../../src/components/StatusHero/StatusHero';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { WeekStrip } from '../../src/components/WeekStrip/WeekStrip';
import { rxText } from '../../src/lib/format';
import { name, pattern, sessionB, thisWeek, todayList } from './data';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Today', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const avgMinutes = (id: 'A' | 'B' | 'C') => {
  const xs = sessions.filter((x) => x.sessionId === id && !x.deload).map((x) => x.durationMin);
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length / 5) * 5;
};

const actions = (
  <>
    <IconButton icon="bell" label="Notifications, 1 new" badge href="#" />
    <IconButton icon="gear" label="Settings" href="#" />
  </>
);

function Today({
  subtitle = 'Tuesday 22 September',
  banner,
  children,
  week = thisWeek(),
}: {
  subtitle?: string;
  banner?: ReactNode;
  children: ReactNode;
  week?: ReturnType<typeof thisWeek>;
}) {
  return (
    <ScreenFrame>
      <TopBar title="Today" subtitle={subtitle} actions={actions} />
      <ScreenBody gap={16}>
        <WeekStrip days={week} />
        {banner}
        {children}
      </ScreenBody>
      <BottomNav active="today" badges={{ coach: true }} />
    </ScreenFrame>
  );
}

function SessionList() {
  return (
    <>
      <div className={s['stack']}>
        <SessionHeader title={sessionB.name} duration={`~${avgMinutes('B')} min`} />
        <InlineNote>Includes 1 change you accepted on Sunday</InlineNote>
      </div>
      <div>
        {todayList.map((e) => (
          <ExerciseCard
            key={e.exerciseId}
            href="#"
            name={name(e.exerciseId)}
            pattern={pattern(e.exerciseId)}
            {...(e.subline ? { subline: e.subline } : {})}
            prescription={<Prescription rx={e.rx} />}
            {...(e.changed ? { diff: <DiffChip size="compact" to="+2.5" /> } : {})}
          />
        ))}
      </div>
      <Button size={64} fullWidth icon={<Icon name="play" size={20} />}>
        Start workout
      </Button>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <Today>
      <SessionList />
    </Today>
  ),
};
export const DefaultLight: Story = {
  name: 'Default (light)',
  globals: { theme: 'light' },
  render: () => (
    <Today>
      <SessionList />
    </Today>
  ),
};

export const RestDay: Story = {
  name: 'Rest day',
  render: () => {
    const c = plannedSession('C');
    const week = thisWeek({ today: '2026-09-23' }).map((d) =>
      d.date === 22 ? { ...d, state: 'done' as const } : d,
    );
    return (
      <Today subtitle="Wednesday 23 September" week={week}>
        <StatusHero icon={<Icon name="moon" size={28} />} title="Rest day." />
        <Card>
          <SectionLabel as="h2">Next session · Thursday</SectionLabel>
          <SessionHeader title={c.name} duration={`~${avgMinutes('C')} min`} as="h3" />
          <p className={s['lede']}>{c.exercises.map((e) => name(e.exerciseId)).join(' · ')}</p>
        </Card>
        <PlaceholderAction
          icon={<Icon name="bike" size={20} />}
          title="Log a ride"
          subtitle="Minutes + effort · coming later"
        />
      </Today>
    );
  },
};

export const DeloadWeek: Story = {
  name: 'Deload week',
  render: () => {
    const d = vpt().progression.deload;
    const [vLo, vHi] = d.volume_cut_pct as [number, number];
    const [, iHi] = d.intensity_cut_pct as [number, number];
    const cut = deloadSets(sessionB.exercises);
    return (
      <Today week={thisWeek({ deload: true })}>
        <Banner tone="deload" title="Deload week">
          <p style={{ margin: '0 0 8px' }}>
            Sets down {vLo}–{vHi}%, weights held or down by up to {iHi}%. Deloads help you manage
            fatigue and keep training; on their own they don’t add extra gains.
          </p>
          <RuleCitation rule={rule('pr.deload')} />
        </Banner>
        <SessionHeader
          title={sessionB.name}
          duration={`~${Math.round(avgMinutes('B') * 0.6)} min`}
          deload
        />
        <div>
          {todayList.map((e, i) => (
            <ExerciseCard
              key={e.exerciseId}
              href="#"
              name={name(e.exerciseId)}
              pattern={pattern(e.exerciseId)}
              prescription={
                <Prescription
                  rx={rxText(cut[i] ?? 1, e.reps, e.load, e.convention)}
                  from={`${e.sets} sets`}
                  tone="deload"
                />
              }
            />
          ))}
        </div>
        <Button size={64} fullWidth icon={<Icon name="play" size={20} />}>
          Start deload session
        </Button>
      </Today>
    );
  },
};

export const SyncFailed: Story = {
  name: 'Sync failed',
  render: () => (
    <Today
      banner={
        <Banner
          tone="unsynced"
          title="2 sessions haven’t synced"
          action={
            <Button variant="secondary-outline" size={44}>
              Retry
            </Button>
          }
        >
          They’re safe on this phone. Your coach can’t see them until they sync.
        </Banner>
      }
    >
      <SessionList />
    </Today>
  ),
};

export const Loading: Story = {
  render: () => (
    <ScreenFrame>
      <TopBar title="Today" subtitle="Tuesday 22 September" actions={actions} />
      <ScreenBody gap={16}>
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading today’s session"
          className={s['stack']}
        >
          <Skeleton shape="block" height={58} />
          <Skeleton width="55%" height={18} />
          {Array.from({ length: 5 }, (_, i) => (
            <ExerciseCardSkeleton key={i} />
          ))}
          <Skeleton shape="block" height={64} />
        </div>
      </ScreenBody>
      <BottomNav active="today" />
    </ScreenFrame>
  ),
};

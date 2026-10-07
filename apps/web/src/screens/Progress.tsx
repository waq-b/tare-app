// Progress (boards Progress, Progress-Empty, Lifts-Table, Health-Overview, Health-Weighin).
// Lifts and Body; Food arrives in P4. Every chart has its table one tap away, and anything
// without enough data says so instead of guessing (hard line 6).
import { goal, rule, safetyRule } from '@tare/data';
import { Icon } from '@tare/icons';
import {
  Button,
  Card,
  ChartFrame,
  ChoiceChip,
  DataTable,
  EmptyState,
  Heatmap,
  HeroNumber,
  InlineNote,
  Legend,
  LineChart,
  ListRow,
  NumberStepper,
  PainFlagCard,
  SectionHeader,
  SegmentedControl,
  Sheet,
  Sparkline,
  StatTile,
  TargetBandBar,
  TextField,
  TextLink,
  TopBar,
  TrendChart,
  type Column,
} from '@tare/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import { useFinishedWorkouts, useProfile, useToday } from '../data/hooks.ts';
import type { Profile, SetRecord, WorkoutRecord } from '../db/index.ts';
import { isoDay, shortDate } from '../lib/dates.ts';
import { nameOf } from '../lib/session.ts';
import {
  e1rmSeries,
  heatWeeks,
  liftRows,
  setsThisWeek,
  sevenDayAverage,
  weeklyRate,
  type LiftRow,
} from '../progress/stats.ts';
import { humanArea } from '../safety/PainForm.tsx';
import { saveWeighIn } from '../progress/weighIn.ts';
import s from './screens.module.css';

/** Headline lifts. */
const LIFTS = [
  'Barbell_Squat',
  'Barbell_Bench_Press_-_Medium_Grip',
  'Barbell_Deadlift',
  'Wide-Grip_Lat_Pulldown',
];
const dm = (d: string) => shortDate(d).slice(4);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function Progress() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'body' ? 'body' : 'lifts';
  return (
    <>
      <TopBar title="Progress" />
      <main className={s['body']}>
        <SegmentedControl
          label="Progress section"
          size="compact"
          value={view}
          onChange={(v) => setParams(v === 'body' ? { view: 'body' } : {}, { replace: true })}
          options={[
            { value: 'lifts', label: 'Lifts' },
            { value: 'body', label: 'Body' },
          ]}
        />
        {view === 'lifts' ? <Lifts /> : <Body />}
      </main>
    </>
  );
}

function Lifts() {
  const { r } = useAppData();
  const today = useToday();
  const workouts = useFinishedWorkouts();
  const sets = useLiveQuery(() => r.sets.all(), [r]);
  const profile = useProfile();
  const [lift, setLift] = useState(LIFTS[1] ?? '');
  if (!workouts || !sets || profile === undefined) return null;
  if (!workouts.length) {
    return (
      <EmptyState
        icon={<Icon name="chart" size={30} />}
        title="Nothing to chart yet"
        actions={
          <Button variant="secondary" size={52} href="/">
            Go to Today
          </Button>
        }
      >
        Trends need a few sessions. Log one to start.
      </EmptyState>
    );
  }
  const series = e1rmSeries(workouts, sets, lift);
  const pts = series.map((p) => ({ x: dm(p.date), y: p.e1rm, detail: p.top }));
  const note = `Estimated 1RM, from working sets of ${(rule('tr.global.e1rm').raw['value'] as { max_reps: number }).max_reps} reps or fewer`;
  const rows = liftRows(workouts, sets, today);

  return (
    <>
      <div role="group" aria-label="Lift" className={s['chips']}>
        {LIFTS.map((id) => (
          <ChoiceChip key={id} tone="accent" selected={lift === id} onToggle={() => setLift(id)}>
            {nameOf(id)}
          </ChoiceChip>
        ))}
      </div>
      <ChartFrame
        title={nameOf(lift)}
        note={note}
        chart={
          pts.length >= 2 ? (
            <>
              <HeroNumber
                label="e1RM"
                qualifier="estimated"
                value={String(pts.at(-1)?.y)}
                unit="kg"
                delta={`${(pts.at(-1)?.y ?? 0) >= (pts[0]?.y ?? 0) ? '+' : ''}${((pts.at(-1)?.y ?? 0) - (pts[0]?.y ?? 0)).toFixed(1)} since ${pts[0]?.x}`}
                deltaTone="progress"
              />
              <LineChart
                points={pts}
                label={`${nameOf(lift)} e1RM, kg (estimated)`}
                unit="kg"
                variant="compact"
              />
            </>
          ) : (
            <p className={s['lede']}>Not enough data yet: the chart starts after two sessions.</p>
          )
        }
        table={
          <DataTable
            caption={`${nameOf(lift)} estimated 1RM by session, kg`}
            columns={[
              { key: 'x', label: 'Session', rowHeader: true },
              { key: 'y', label: 'e1RM', numeric: true },
            ]}
            rows={pts}
          />
        }
      />
      {profile ? (
        <WeeklySets profile={profile} workouts={workouts} sets={sets} today={today} />
      ) : null}
      {rows.length ? <AllLifts rows={rows} /> : null}
      <div>
        <SectionHeader title="Sessions" meta={<TextLink href="/history">All sessions</TextLink>} />
        {workouts.slice(0, 4).map((w) => (
          <ListRow
            key={w.id}
            title={w.sessionKey ? `Session ${w.sessionKey}` : 'Workout'}
            subtitle={`${shortDate(w.date)} · ${Math.round(((w.finishedAt ?? w.startedAt) - w.startedAt) / 60000)} min`}
            href={`/history/${w.id}`}
          />
        ))}
      </div>
    </>
  );
}

function WeeklySets({
  profile,
  workouts,
  sets,
  today,
}: {
  profile: Profile;
  workouts: WorkoutRecord[];
  sets: SetRecord[];
  today: string;
}) {
  const g = goal(profile.goalId) as unknown as {
    goal: string;
    weekly_sets_per_muscle?: Record<string, { min: number; optimal: number; max: number }>;
  };
  const band = g.weekly_sets_per_muscle?.[profile.level];
  const per = Object.entries(setsThisWeek(workouts, sets, today).perMuscle).sort(
    (a, b) => b[1] - a[1],
  );
  return (
    <Card>
      <SectionHeader
        title="Sets this week"
        meta={
          band
            ? `Target ${band.min}–${band.max} (${g.goal.replace('_', ' ')}, ${profile.level})`
            : undefined
        }
      />
      {per.length === 0 ? (
        <p className={s['lede']}>No sets yet this week.</p>
      ) : band ? (
        per.map(([m, v]) => (
          <TargetBandBar
            key={m}
            label={cap(m)}
            value={v}
            band={band}
            scaleMax={Math.max(band.max + 4, ...per.map((x) => x[1]))}
          />
        ))
      ) : (
        <p className={s['lede']}>Your goal has no weekly set target.</p>
      )}
    </Card>
  );
}

function AllLifts({ rows }: { rows: LiftRow[] }) {
  const columns: Column<LiftRow & { lift: string }>[] = [
    { key: 'lift', label: 'Lift', rowHeader: true },
    { key: 'top', label: 'Top set', numeric: true },
    { key: 'e1rm', label: 'e1RM', numeric: true, sortable: true },
    {
      key: 'change',
      label: '6 wk',
      numeric: true,
      sortable: true,
      render: (r) => `${r.change >= 0 ? '+' : ''}${r.change}`,
      tone: (r) => (r.change > 0 ? 'progress' : 'neutral'),
    },
    { key: 'trend', label: 'Trend', render: (r) => <Sparkline values={r.trend} /> },
  ];
  return (
    <DataTable
      caption="All lifts: estimated 1RM, kg"
      columns={columns}
      rows={rows.map((r) => ({ ...r, lift: nameOf(r.exerciseId) }))}
      sortBy="e1rm"
    />
  );
}

function Body() {
  const { r } = useAppData();
  const today = useToday();
  const weighIns = useLiveQuery(() => r.weighIns.list(), [r]);
  const workouts = useFinishedWorkouts();
  const flags = useLiveQuery(() => r.painFlags.active(), [r]);
  const screening = useLiveQuery(async () => (await r.screening.latest()) ?? null, [r]);
  const [logging, setLogging] = useState(false);
  if (!weighIns || !workouts || !flags || screening === undefined) return null;

  const avg = sevenDayAverage(weighIns, today);
  const latest = weighIns.at(-1);
  const raw = weighIns.map((w) => ({ x: dm(w.date), y: w.kg }));
  const average = weighIns.map((w) => ({
    x: dm(w.date),
    y: sevenDayAverage(weighIns, w.date) ?? w.kg,
  }));
  const rate = weeklyRate(weighIns, today);
  const waist = [...weighIns].reverse().find((w) => w.waistCm)?.waistCm;
  const flag = flags[0];

  return (
    <>
      <Card>
        <div className={s['row']} style={{ justifyContent: 'space-between' }}>
          {avg !== null ? (
            <HeroNumber label="Bodyweight" value={String(avg)} unit="kg" delta="7-day average" />
          ) : (
            <HeroNumber
              label="Bodyweight"
              value={latest ? String(latest.kg) : '—'}
              unit="kg"
              delta={latest ? `Last ${shortDate(latest.date)}` : 'No weigh-ins yet'}
            />
          )}
          <Button
            variant="secondary"
            size={52}
            icon={<Icon name="plus" size={18} />}
            onClick={() => setLogging(true)}
          >
            Log
          </Button>
        </div>
        {weighIns.length >= 2 ? (
          <>
            <TrendChart raw={raw} average={average} label="Bodyweight, kg" unit="kg" />
            <Legend
              items={[
                { label: 'Weigh-in', color: 'var(--text-3)', mark: 'dot' },
                { label: '7-day average', color: 'var(--accent)', mark: 'line' },
              ]}
            />
          </>
        ) : (
          <p className={s['lede']}>Not enough data yet: the trend starts after two weigh-ins.</p>
        )}
      </Card>
      <div className={s['grid2']}>
        <StatTile
          label="Rate"
          value={rate === null ? '—' : `${rate > 0 ? '+' : ''}${rate}`}
          unit="kg/wk"
          {...(rate === null ? { caption: 'after 2 weeks' } : {})}
        />
        <StatTile label="Waist" value={waist ? String(waist) : '—'} unit="cm" />
        <StatTile label="Sessions" value={String(workouts.length)} caption="logged" />
        <StatTile label="Weigh-ins" value={String(weighIns.length)} caption="any day counts" />
      </div>
      <Card>
        <SectionHeader title="Consistency" />
        <Heatmap weeks={heatWeeks(workouts, today)} label="Consistency, last 9 weeks" />
      </Card>
      {flag ? (
        <PainFlagCard
          area={
            flag.area
              ? humanArea(`${flag.side && flag.side !== 'both' ? `${flag.side} ` : ''}${flag.area}`)
              : 'Pain flag'
          }
          when={`Flagged ${shortDate(flag.date)}`}
          status="active"
          rule={safetyRule(flag.ruleId)}
          onFeelsClear={() => void r.painFlags.clear(flag.id, today)}
          allFlagsHref="/pain-flags"
        />
      ) : null}
      {screening ? (
        <ListRow
          leading={<Icon name="heart" size={22} />}
          title="Health answers"
          subtitle={shortDate(isoDay(new Date(screening.takenAt)))}
          value={
            screening.mskAreas.length
              ? `${cap(screening.mskAreas.join(', ').replace(/_/g, ' '))} noted`
              : 'Nothing noted'
          }
        />
      ) : null}
      {logging ? (
        <WeighInSheet onClose={() => setLogging(false)} last={latest?.kg ?? null} />
      ) : null}
    </>
  );
}

function WeighInSheet({ onClose, last }: { onClose: () => void; last: number | null }) {
  const data = useAppData();
  const [kg, setKg] = useState(last ?? 80);
  const [waist, setWaist] = useState('');
  return (
    <Sheet
      open
      title="Log weigh-in"
      onClose={onClose}
      footer={
        <Button
          size={60}
          fullWidth
          onClick={() => {
            const w = Number(waist.replace(',', '.'));
            void saveWeighIn(data, kg, waist && Number.isFinite(w) && w > 0 ? w : null).then(
              onClose,
            );
          }}
        >
          Save
        </Button>
      }
    >
      <NumberStepper
        label="Bodyweight"
        value={kg}
        step={0.1}
        min={20}
        unit="kg"
        size={76}
        onChange={(v) => setKg(Math.round(v * 10) / 10)}
      />
      <TextField
        label="Waist · optional"
        inputMode="decimal"
        placeholder="cm"
        value={waist}
        onChange={setWaist}
      />
      <InlineNote>Weigh in whenever suits you. Charts use the 7-day average.</InlineNote>
    </Sheet>
  );
}

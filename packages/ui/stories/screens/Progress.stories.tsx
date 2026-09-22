// Boards: Progress, Progress-Empty, Lifts-Table, Chart-Detail, Health-Overview, Health-Weighin.
import { safetyRule } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import {
  e1rmHistory,
  e1rmRule,
  painFlags,
  sessions,
  sevenDayAverage,
  shortDate,
  TODAY,
  weighIns,
} from '../../fixtures';
import {
  heatWeeks,
  liftRows,
  setBand,
  setsWeek8,
  weighInAvg,
  weighInRaw,
} from '../../fixtures/charts';
import { BottomNav } from '../../src/components/BottomNav/BottomNav';
import { Button } from '../../src/components/Button/Button';
import { Card } from '../../src/components/Card/Card';
import { Heatmap, TargetBandBar } from '../../src/components/Charts/Bars';
import { LineChart, Sparkline, TrendChart } from '../../src/components/Charts/LineChart';
import { HeroNumber, StatTile } from '../../src/components/Charts/Stats';
import { ChartFrame, DataTable, type Column } from '../../src/components/Charts/Table';
import { ChoiceChip } from '../../src/components/ChoiceChip/ChoiceChip';
import { EmptyState } from '../../src/components/EmptyState/EmptyState';
import { FieldButton } from '../../src/components/FieldButton/FieldButton';
import { InlineNote } from '../../src/components/InlineNote/InlineNote';
import { Legend } from '../../src/components/Legend/Legend';
import { ListRow } from '../../src/components/ListRow/ListRow';
import { NumberStepper } from '../../src/components/NumberStepper/NumberStepper';
import { PainFlagCard } from '../../src/components/PainFlagCard/PainFlagCard';
import { SectionHeader } from '../../src/components/SectionHeader/SectionHeader';
import { SegmentedControl } from '../../src/components/SegmentedControl/SegmentedControl';
import { Sheet } from '../../src/components/Sheet/Sheet';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { name } from './data';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Progress', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const LIFTS = [
  'Barbell_Squat',
  'Barbell_Bench_Press_-_Medium_Grip',
  'Barbell_Deadlift',
  'Wide-Grip_Lat_Pulldown',
];
const dm = (d: string) => shortDate(d).slice(4);
const series = (id: string) => e1rmHistory(id).map((p) => ({ x: dm(p.date), y: p.e1rm }));
const e1rmNote = `Estimated 1RM, from working sets of ${e1rmRule.max_reps} reps or fewer`;

function Tabbed({ tab, children }: { tab: 'lifts' | 'body' | 'food'; children: ReactNode }) {
  return (
    <ScreenFrame>
      <TopBar title="Progress" subtitle="8 weeks" />
      <ScreenBody gap={16}>
        <SegmentedControl
          label="Progress section"
          size="compact"
          value={tab}
          options={[
            { value: 'lifts', label: 'Lifts' },
            { value: 'body', label: 'Body' },
            { value: 'food', label: 'Food' },
          ]}
        />
        {children}
      </ScreenBody>
      <BottomNav active="progress" />
    </ScreenFrame>
  );
}

const liftTable = (id: string) => (
  <DataTable
    caption={`${name(id)} estimated 1RM by session, kg`}
    columns={[
      { key: 'x', label: 'Session', rowHeader: true },
      { key: 'y', label: 'e1RM', numeric: true },
    ]}
    rows={series(id)}
  />
);

export const Lifts: Story = {
  render: function Render() {
    const [lift, setLift] = useState(LIFTS[1]!);
    const pts = series(lift);
    return (
      <Tabbed tab="lifts">
        <div role="group" aria-label="Lift" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LIFTS.map((id) => (
            <ChoiceChip key={id} tone="accent" selected={lift === id} onToggle={() => setLift(id)}>
              {name(id)}
            </ChoiceChip>
          ))}
        </div>
        <ChartFrame
          title={name(lift)}
          note={e1rmNote}
          chart={
            <>
              <HeroNumber
                label="e1RM"
                qualifier="estimated"
                value={String(pts.at(-1)?.y)}
                unit="kg"
                delta={`+${((pts.at(-1)?.y ?? 0) - (pts[0]?.y ?? 0)).toFixed(1)} since ${pts[0]?.x}`}
                deltaTone="progress"
              />
              <LineChart
                points={pts}
                label={`${name(lift)} e1RM, kg (estimated)`}
                unit="kg"
                variant="compact"
              />
            </>
          }
          table={liftTable(lift)}
        />
        <Card>
          <SectionHeader
            title="Weekly sets"
            meta={`Target ${setBand.min}–${setBand.max} (fat loss, beginner)`}
          />
          {setsWeek8.slice(0, 8).map((m) => (
            <TargetBandBar
              key={m.label}
              label={m.label}
              value={m.value}
              band={setBand}
              scaleMax={16}
            />
          ))}
        </Card>
        <div>
          <SectionHeader title="Sessions" />
          {sessions
            .slice(-4)
            .reverse()
            .map((x) => (
              <ListRow
                key={x.id}
                title={`Session ${x.sessionId}`}
                subtitle={`${shortDate(x.date)} · ${x.durationMin} min`}
                href="#"
              />
            ))}
        </div>
      </Tabbed>
    );
  },
};

export const Empty: Story = {
  render: () => (
    <ScreenFrame>
      <TopBar title="Progress" />
      <ScreenBody>
        <EmptyState
          icon={<Icon name="chart" size={30} />}
          title="Nothing to chart yet"
          actions={
            <Button variant="secondary" size={52}>
              Go to Today
            </Button>
          }
        >
          Trends need a few sessions. Log one to start.
        </EmptyState>
      </ScreenBody>
      <BottomNav active="progress" />
    </ScreenFrame>
  ),
};

type LiftRow = (typeof liftRows)[number];
const liftColumns: Column<LiftRow>[] = [
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

export const LiftsTable: Story = {
  name: 'Lifts table',
  render: () => (
    <Tabbed tab="lifts">
      <InlineNote>{e1rmNote}</InlineNote>
      <DataTable
        caption="All lifts: estimated 1RM, kg"
        columns={liftColumns}
        rows={liftRows}
        sortBy="e1rm"
      />
    </Tabbed>
  ),
};

export const LiftChart: Story = {
  name: 'Lift chart',
  render: function Render() {
    const id = LIFTS[1]!;
    const [range, setRange] = useState('8w');
    const pts = series(id);
    return (
      <ScreenFrame>
        <TopBar back={{ href: '#' }} title={name(id)} subtitle="e1RM · kg · estimated" />
        <ScreenBody gap={16}>
          <HeroNumber
            label="e1RM"
            qualifier="estimated"
            value={String(pts.at(-1)?.y)}
            unit="kg"
            delta={`+${((pts.at(-1)?.y ?? 0) - (pts[0]?.y ?? 0)).toFixed(1)} in 8 weeks`}
            deltaTone="progress"
          />
          <SegmentedControl
            label="Range"
            size="compact"
            value={range}
            onChange={setRange}
            options={['4w', '8w', '6m', '1y', 'all'].map((v) => ({
              value: v,
              label: v.toUpperCase(),
            }))}
          />
          <LineChart points={pts} label={`${name(id)} e1RM, kg (estimated)`} unit="kg" />
          {liftTable(id)}
        </ScreenBody>
      </ScreenFrame>
    );
  },
};

const avgNow = sevenDayAverage(TODAY) ?? weighInAvg.at(-1)?.y ?? 0;
const avgStart = weighInAvg[0]?.y ?? avgNow;
const weeks = 8;
const rate = Math.round(((avgNow - avgStart) / weeks) * 10) / 10;
const waist = [...weighIns].reverse().find((w) => w.waistCm)?.waistCm;
const active = painFlags.find((f) => f.status === 'active')!;

function Body({ sheet }: { sheet?: ReactNode }) {
  return (
    <ScreenFrame>
      <TopBar title="Progress" subtitle="Body · 8 weeks" />
      <ScreenBody gap={16}>
        <SegmentedControl
          label="Progress section"
          size="compact"
          value="body"
          options={[
            { value: 'lifts', label: 'Lifts' },
            { value: 'body', label: 'Body' },
            { value: 'food', label: 'Food' },
          ]}
        />
        <Card>
          <div className={s['row']} style={{ justifyContent: 'space-between' }}>
            <HeroNumber label="Bodyweight" value={String(avgNow)} unit="kg" delta="7-day average" />
            <Button variant="secondary" size={44} icon={<Icon name="plus" size={18} />}>
              Log
            </Button>
          </div>
          <TrendChart raw={weighInRaw} average={weighInAvg} label="Bodyweight, kg" unit="kg" />
          <Legend
            items={[
              { label: 'Weigh-in', color: 'var(--text-3)', mark: 'dot' },
              { label: '7-day average', color: 'var(--accent)', mark: 'line' },
            ]}
          />
        </Card>
        <div className={s['grid2']}>
          <StatTile label="Rate" value={`${rate > 0 ? '+' : ''}${rate}`} unit="kg/wk" />
          <StatTile label="Waist" value={String(waist ?? '—')} unit="cm" />
          <StatTile label="Sessions" value={String(sessions.length)} caption="in 8 weeks" />
          <StatTile label="Weigh-ins" value={String(weighIns.length)} caption="any day counts" />
        </div>
        <Card>
          <SectionHeader title="Consistency" />
          <Heatmap weeks={heatWeeks} label="Consistency" />
        </Card>
        <PainFlagCard
          area="Right shoulder"
          when={`Flagged ${shortDate(active.date)}`}
          status="active"
          rule={safetyRule(active.ruleId)}
          allFlagsHref="#"
        />
        <ListRow
          leading={<Icon name="heart" size={22} />}
          title="Health answers"
          subtitle="Synced to your account"
          value="Knee noted"
          href="#"
        />
      </ScreenBody>
      <BottomNav active="progress" />
      {sheet}
    </ScreenFrame>
  );
}

export const BodyStory: Story = { name: 'Body', render: () => <Body /> };

function WeighInSheet() {
  const [kg, setKg] = useState(avgNow);
  return (
    <Sheet
      open
      title="Log weigh-in"
      onClose={() => undefined}
      footer={
        <Button size={60} fullWidth>
          Save
        </Button>
      }
    >
      <NumberStepper
        label="Bodyweight"
        value={kg}
        step={0.1}
        unit="kg"
        size={76}
        onChange={setKg}
      />
      <FieldButton label="When" value="Today, 07:12" />
      <FieldButton label="Waist · optional" placeholder="Add waist" />
      <InlineNote>Weigh in whenever suits you. Charts use the 7-day average.</InlineNote>
    </Sheet>
  );
}
export const LogWeighIn: Story = {
  name: 'Log weigh-in',
  render: () => <Body sheet={<WeighInSheet />} />,
};

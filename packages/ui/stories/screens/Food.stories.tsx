// Boards: Nutrition-Today, Nutrition-Week, Nutrition-Empty. P4: targets are FIXTURES (vpt has none, #20).
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FIXTURE_FOOD_TARGETS,
  FIXTURE_FOOD_WEEK,
  FIXTURE_MACROS_TODAY,
  FIXTURE_MEALS_TODAY,
  shortDate,
} from '../../fixtures';
import { Banner } from '../../src/components/Banner/Banner';
import { BottomNav } from '../../src/components/BottomNav/BottomNav';
import { Card } from '../../src/components/Card/Card';
import { DayDots, MacroBar, Meter, TargetBars } from '../../src/components/Charts/Bars';
import { StatTile } from '../../src/components/Charts/Stats';
import { ChartFrame, DataTable } from '../../src/components/Charts/Table';
import { EmptyState } from '../../src/components/EmptyState/EmptyState';
import { IconTile } from '../../src/components/IconTile/IconTile';
import { InlineNote } from '../../src/components/InlineNote/InlineNote';
import { ListRow } from '../../src/components/ListRow/ListRow';
import { MealRow } from '../../src/components/MealRow/MealRow';
import { SegmentedControl } from '../../src/components/SegmentedControl/SegmentedControl';
import { Tag } from '../../src/components/Tag/Tag';
import { TextLink } from '../../src/components/TextLink/TextLink';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Food', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const tab = (
  <SegmentedControl
    label="Progress section"
    size="compact"
    value="food"
    options={[
      { value: 'lifts', label: 'Lifts' },
      { value: 'body', label: 'Body' },
      { value: 'food', label: 'Food' },
    ]}
  />
);
const eaten = FIXTURE_MEALS_TODAY.reduce(
  (a, m) => ({ kcal: a.kcal + (m.kcal ?? 0), p: a.p + (m.proteinG ?? 0) }),
  { kcal: 0, p: 0 },
);

export const Today: Story = {
  render: () => (
    <ScreenFrame>
      <TopBar title="Progress" subtitle="Food · today" />
      <ScreenBody gap={16}>
        {tab}
        <InlineNote kind="imported">Imported from your food app · 14:05</InlineNote>
        <Card>
          <Meter
            label="Energy"
            value={eaten.kcal}
            target={FIXTURE_FOOD_TARGETS.energyKcal}
            unit="kcal"
          />
          <Meter label="Protein" value={eaten.p} target={FIXTURE_FOOD_TARGETS.proteinG} unit="g" />
        </Card>
        <MacroBar
          segments={[
            { label: 'Protein', grams: FIXTURE_MACROS_TODAY.proteinG },
            { label: 'Carbs', grams: FIXTURE_MACROS_TODAY.carbsG },
            { label: 'Fat', grams: FIXTURE_MACROS_TODAY.fatG },
          ]}
        />
        <div>
          {FIXTURE_MEALS_TODAY.map((m) => (
            <MealRow key={m.name} {...m} />
          ))}
        </div>
        <Banner tone="info" title="Dinner not logged yet" />
        <TextLink href="#" chevron>
          See this week
        </TextLink>
      </ScreenBody>
      <BottomNav active="progress" />
    </ScreenFrame>
  ),
};

const logged = FIXTURE_FOOD_WEEK.filter((d) => d.kcal != null);
const avg = (k: 'kcal' | 'proteinG') =>
  Math.round(logged.reduce((a, d) => a + (d[k] ?? 0), 0) / logged.length);
const band = {
  min: FIXTURE_FOOD_TARGETS.energyKcal - 200,
  max: FIXTURE_FOOD_TARGETS.energyKcal + 100,
};

export const Week: Story = {
  render: () => (
    <ScreenFrame>
      <TopBar back={{ href: '#' }} title="Food" subtitle="This week · imported" />
      <ScreenBody gap={16}>
        <div className={s['grid2']}>
          <StatTile label="Energy" value={avg('kcal').toLocaleString('en-GB')} unit="kcal/day" />
          <StatTile label="Protein" value={String(avg('proteinG'))} unit="g/day" />
        </div>
        <ChartFrame
          title="Energy"
          note="Imported from your food app. Target band is a placeholder until food rules exist."
          chart={
            <TargetBars
              bars={FIXTURE_FOOD_WEEK.map((d) => ({
                label: shortDate(d.date).slice(0, 1),
                value: d.kcal,
              }))}
              band={band}
              label="Energy this week, kcal (imported)"
              unit="kcal"
            />
          }
          table={
            <DataTable
              caption="Food this week"
              columns={[
                { key: 'day', label: 'Day', rowHeader: true },
                { key: 'kcal', label: 'kcal', numeric: true },
                { key: 'protein', label: 'Protein', numeric: true },
                { key: 'type', label: 'Day type' },
              ]}
              rows={FIXTURE_FOOD_WEEK.map((d) => ({
                day: shortDate(d.date).slice(0, 3),
                kcal: d.kcal ?? '—',
                protein: d.proteinG ?? '—',
                type: d.dayType,
              }))}
            />
          }
        />
        <Card>
          <DayDots
            label="Protein target this week"
            days={FIXTURE_FOOD_WEEK.map((d) => ({
              letter: shortDate(d.date).slice(0, 1),
              name: shortDate(d.date),
              state:
                d.proteinG == null
                  ? 'none'
                  : d.proteinG >= FIXTURE_FOOD_TARGETS.proteinG
                    ? 'hit'
                    : 'miss',
            }))}
          />
        </Card>
      </ScreenBody>
    </ScreenFrame>
  ),
};

export const NotConnected: Story = {
  name: 'Not connected',
  render: () => (
    <ScreenFrame>
      <TopBar title="Progress" subtitle="Food" />
      <ScreenBody gap={16}>
        {tab}
        <EmptyState
          layout="left"
          icon={<Icon name="food" size={28} />}
          title="Connect your food log"
          extra={
            <div className={s['stack']}>
              <ListRow
                variant="option"
                leading={
                  <IconTile size={40}>
                    <Icon name="download" size={20} />
                  </IconTile>
                }
                title="Import a file"
                subtitle="Export from your food app, then pick the file"
                trailing={<Tag tone="accent">Suggested</Tag>}
                onClick={() => undefined}
              />
              <ListRow
                variant="option"
                leading={
                  <IconTile size={40}>
                    <Icon name="coach" size={20} />
                  </IconTile>
                }
                title="Through your Claude"
                subtitle="Your Claude reads the export for you"
                onClick={() => undefined}
              />
              <ListRow
                variant="option"
                leading={
                  <IconTile size={40}>
                    <Icon name="heart" size={20} />
                  </IconTile>
                }
                title="Apple Health / Health Connect"
                subtitle="Coming later"
                disabled
                onClick={() => undefined}
              />
            </div>
          }
        >
          Tare reads what you already log. It never asks you to log food twice.
        </EmptyState>
        <p className={s['lede']} style={{ fontSize: 13 }}>
          Imports stay with your account. You can delete them any time.
        </p>
      </ScreenBody>
      <BottomNav active="progress" />
    </ScreenFrame>
  ),
};

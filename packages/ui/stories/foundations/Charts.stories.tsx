// Board: Charts.dc.html. The chart rules, series colours, and every chart with fixture data.
import { cssVar } from '@tare/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FIXTURE_FOOD_TARGETS, FIXTURE_MACROS_TODAY } from '../../fixtures';
import {
  benchE1rm,
  heatWeeks,
  liftRows,
  setBand,
  setsWeek8,
  weighInAvg,
  weighInRaw,
} from '../../fixtures/charts';
import { Heatmap, MacroBar, Meter, TargetBandBar } from '../../src/components/Charts/Bars';
import { LineChart, Sparkline, TrendChart } from '../../src/components/Charts/LineChart';
import { HeroNumber, StatTile } from '../../src/components/Charts/Stats';
import { ChartFrame, DataTable } from '../../src/components/Charts/Table';
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
      <ChartFrame
        title="LineChart"
        note="Bench press e1RM, estimated from sets of 10 reps or fewer"
        chart={<LineChart points={benchE1rm} label="Bench press e1RM, kg (estimated)" unit="kg" />}
        table={
          <DataTable
            caption="Bench press e1RM, kg"
            columns={[
              { key: 'x', label: 'Session', rowHeader: true },
              { key: 'y', label: 'e1RM', numeric: true },
            ]}
            rows={benchE1rm}
          />
        }
      />
      <section>
        <h2 className={s['h2']}>TrendChart · HeroNumber · StatTile</h2>
        <HeroNumber
          label="Bodyweight"
          value={String(weighInAvg.at(-1)?.y)}
          unit="kg"
          delta="7-day average"
        />
        <TrendChart raw={weighInRaw} average={weighInAvg} label="Bodyweight, kg" unit="kg" />
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}
        >
          <StatTile label="Time" value="54" unit="min" />
          <StatTile label="Volume" value="7,960" unit="kg" />
          <StatTile label="Sets" value="16" />
        </div>
      </section>
      <section>
        <h2 className={s['h2']}>TargetBandBar: weekly sets, target from tr.goal.fat_loss</h2>
        {setsWeek8.slice(0, 6).map((m) => (
          <TargetBandBar
            key={m.label}
            label={m.label}
            value={m.value}
            band={setBand}
            scaleMax={16}
          />
        ))}
      </section>
      <section>
        <h2 className={s['h2']}>MacroBar · Meter (fixture food targets)</h2>
        <MacroBar
          segments={[
            { label: 'Protein', grams: FIXTURE_MACROS_TODAY.proteinG },
            { label: 'Carbs', grams: FIXTURE_MACROS_TODAY.carbsG },
            { label: 'Fat', grams: FIXTURE_MACROS_TODAY.fatG },
          ]}
        />
        <div style={{ marginTop: 12 }}>
          <Meter label="Protein" value={108} target={FIXTURE_FOOD_TARGETS.proteinG} unit="g" />
        </div>
      </section>
      <section>
        <h2 className={s['h2']}>Heatmap</h2>
        <Heatmap weeks={heatWeeks} label="Consistency" />
      </section>
      <section>
        <h2 className={s['h2']}>DataTable with sparklines</h2>
        <DataTable
          caption="All lifts"
          columns={[
            { key: 'lift', label: 'Lift', rowHeader: true },
            { key: 'top', label: 'Top set', numeric: true },
            { key: 'e1rm', label: 'e1RM', numeric: true },
            { key: 'trend', label: 'Trend', render: (r) => <Sparkline values={r.trend} /> },
          ]}
          rows={liftRows}
        />
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

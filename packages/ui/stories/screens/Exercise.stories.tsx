// Board: Exercise-Detail (bench press).
import { exercise, rule } from '@tare/data';
import { MuscleMap, muscles, type Muscle } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { e1rmHistory, historyOf, setCounting, shortDate } from '../../fixtures';
import { Card } from '../../src/components/Card/Card';
import { HeroNumber } from '../../src/components/Charts/Stats';
import { LineChart } from '../../src/components/Charts/LineChart';
import { ExerciseHeader } from '../../src/components/ExerciseHeader/ExerciseHeader';
import { IconButton } from '../../src/components/IconButton/IconButton';
import { Legend } from '../../src/components/Legend/Legend';
import { ListRow } from '../../src/components/ListRow/ListRow';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { StepList } from '../../src/components/StepList/StepList';
import { SwapRow } from '../../src/components/SwapRow/SwapRow';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { WhyCard } from '../../src/components/WhyCard/WhyCard';
import { bench, name, pattern, swapStart, swapsFor } from './data';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Exercise', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;

const id = bench.exerciseId;
const ex = exercise(id);
const asMuscles = (xs: readonly string[]) =>
  xs.filter((m): m is Muscle => (muscles as readonly string[]).includes(m));
const points = e1rmHistory(id).map((p) => ({ x: shortDate(p.date).slice(4), y: p.e1rm }));
const recent = historyOf(id).slice(-3).reverse();

export const Detail: StoryObj = {
  render: () => (
    <ScreenFrame>
      <TopBar
        back={{ href: '#' }}
        actions={<IconButton icon="swap" label={`Swap ${name(id)}`} variant="outlined" />}
      />
      <ScreenBody gap={20}>
        <ExerciseHeader
          name={name(id)}
          muscles={`${ex.movement_pattern.replace('_', ' ')} · ${ex.equipment.join(', ')}`}
          pattern={pattern(id)}
          size="detail"
        />
        <Card>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <MuscleMap
              view="front"
              primary={asMuscles(ex.primary_muscles)}
              secondary={asMuscles(ex.secondary_muscles)}
              width={64}
              title={`${name(id)} muscles, front`}
            />
            <MuscleMap
              view="back"
              primary={asMuscles(ex.primary_muscles)}
              secondary={asMuscles(ex.secondary_muscles)}
              width={64}
              title={`${name(id)} muscles, back`}
            />
          </div>
          <Legend
            items={[
              {
                label: `Primary · ${setCounting.primary} set per set`,
                color: 'var(--muscle-primary)',
              },
              {
                label: `Secondary · ${setCounting.secondary} set per set`,
                color: 'var(--muscle-secondary)',
              },
            ]}
          />
        </Card>
        <div className={s['stack']}>
          <SectionLabel>Cues</SectionLabel>
          <StepList steps={ex.cues} />
        </div>
        <div className={s['stack']}>
          <HeroNumber
            label="Estimated 1RM"
            qualifier="estimated"
            value={String(points.at(-1)?.y)}
            unit="kg"
          />
          <LineChart
            points={points}
            label={`${name(id)} e1RM, kg (estimated)`}
            unit="kg"
            variant="compact"
          />
        </div>
        <div>
          <SectionLabel>Recent sessions</SectionLabel>
          {recent.map((h) => {
            const work = h.sets.filter((w) => w.kind === 'work');
            return (
              <ListRow
                key={h.date}
                title={shortDate(h.date)}
                value={`${work[0]?.load} × ${work.map((w) => w.reps).join(' · ')}`}
                valueMono
                href="#"
              />
            );
          })}
        </div>
        <WhyCard rules={[rule('pr.double_progression')]}>
          When every set reaches the top of the rep range twice in a row, the weight goes up and the
          reps start again at the bottom.
        </WhyCard>
        <div className={s['stack']}>
          <SectionLabel>Swaps for your kit</SectionLabel>
          {swapsFor(id).map((o) => (
            <SwapRow
              key={o.id}
              name={o.name}
              pattern={o.pattern}
              load={swapStart(id, o.id, bench.load)}
              href="#"
            />
          ))}
        </div>
      </ScreenBody>
    </ScreenFrame>
  ),
};

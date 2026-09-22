// Board: Plan-Week.
import { vpt } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CURRENT_WEEK, DELOAD_WEEK, plan } from '../../fixtures';
import { BottomNav } from '../../src/components/BottomNav/BottomNav';
import { Button } from '../../src/components/Button/Button';
import { InlineNote } from '../../src/components/InlineNote/InlineNote';
import { PlanDayRow } from '../../src/components/PlanDayRow/PlanDayRow';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { name } from './data';
import { ScreenBody, ScreenFrame } from './Screen';

const meta = { title: 'Screens/Plan', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const every = vpt().progression.deload.default_every_n_weeks;
const nextDeload = DELOAD_WEEK + every + 1;
const block = Math.floor((CURRENT_WEEK - 1) / (every + 1)) + 1;

export const Week: StoryObj = {
  render: () => (
    <ScreenFrame>
      <TopBar
        title="Plan"
        subtitle={`Week ${CURRENT_WEEK} · block ${block} · ${plan.length} sessions`}
        actions={
          <Button variant="secondary-outline" size={44}>
            Edit
          </Button>
        }
      />
      <ScreenBody gap={8}>
        {DAYS.map((day, i) => {
          const p = plan.find((x) => x.weekday === i);
          if (p) {
            return (
              <PlanDayRow
                key={day}
                kind="session"
                day={day}
                letter={p.id}
                title={p.name.split(' · ')[1] ?? p.name}
                summary={p.exercises.map((e) => name(e.exerciseId)).join(' · ')}
                href="#"
                onReorder={() => undefined}
              />
            );
          }
          return i === 4 ? (
            <PlanDayRow key={day} kind="ride" day={day} />
          ) : (
            <PlanDayRow key={day} kind="rest" day={day} />
          );
        })}
        <InlineNote>
          Built from vpt v{vpt().version} · next deload week {nextDeload}
        </InlineNote>
      </ScreenBody>
      <BottomNav active="plan" />
    </ScreenFrame>
  ),
};

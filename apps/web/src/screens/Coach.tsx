// Coach (boards Coach-Early, Coach-None). Your own Claude reviews from P2. Until you have the
// weeks of logs the ramp rule asks for, it says so honestly; after that, a rules-only summary.
import { deloadRule, labelFromId, progressionText, rule } from '@tare/data';
import { isStalled } from '@tare/engine';
import { Icon } from '@tare/icons';
import { Card, EmptyState, ListRow, SectionLabel, StepProgress, TopBar } from '@tare/ui';
import { useActivePlan, useToday } from '../data/hooks.ts';
import { addDays } from '../lib/dates.ts';
import { nameOf } from '../lib/session.ts';
import { usePlanState } from '../plan/usePlanTargets.ts';
import s from './screens.module.css';

const RULES_RUNNING = ['pr.double_progression', 'pr.stall', 'pr.deload'];

function RulesRunning() {
  return (
    <Card>
      <SectionLabel as="h2">Rules running now</SectionLabel>
      {RULES_RUNNING.map((id) => {
        const r = rule(id).raw;
        const label = labelFromId(id);
        return (
          <ListRow
            key={id}
            title={label.charAt(0).toUpperCase() + label.slice(1)}
            subtitle={String(r['trigger'] ?? r['definition'] ?? r['method'] ?? '')}
          />
        );
      })}
    </Card>
  );
}

export function Coach() {
  const plan = useActivePlan();
  const today = useToday();
  const state = usePlanState(plan, today);
  const need = progressionText().aiAfterWeeks;
  if (plan === undefined || (plan && !state)) return <main aria-busy="true" aria-label="Loading" />;

  const weeks = state?.block.weeksOfLogs ?? 0;
  if (!state || weeks < need) {
    const week = Math.min(need, (state?.block.week ?? 0) || 1);
    return (
      <>
        <TopBar title="Coach" />
        <main className={s['body']} style={{ gap: 20 }}>
          <EmptyState
            layout="left"
            icon={<Icon name="coach" size={28} />}
            title="Not enough data yet."
            extra={
              <StepProgress
                total={need}
                done={Math.min(weeks, need)}
                current={Math.min(weeks, need - 1)}
                label={`Week ${week} of ${need} before your first review`}
                labels={Array.from({ length: need }, (_, i) => `Wk ${i + 1}`)}
              />
            }
          >
            {String(rule('pr.new_user_ramp').raw['rule'])}
          </EmptyState>
          <RulesRunning />
        </main>
      </>
    );
  }

  // Rules-only summary until your Claude connects (P2).
  const { snap, block } = state;
  const since = addDays(today, -28);
  const ups = snap.changes.filter(
    (c) => c.kind === 'progression' && c.status === 'applied' && c.date >= since,
  );
  const decided = snap.changes.filter((c) => c.status === 'accepted' || c.status === 'kept');
  const ids = plan
    ? [...new Set(plan.sessions.flatMap((x) => x.exercises.map((e) => e.exerciseId)))]
    : [];
  const stalled = ids.filter((id) => isStalled(snap.history[id] ?? []));
  const cycle = deloadRule().default_every_n_weeks + 1;
  const nextDeload = block.week + ((cycle - (block.week % cycle)) % cycle);

  return (
    <>
      <TopBar title="Coach" subtitle="Rules only, until your Claude connects" />
      <main className={s['body']} style={{ gap: 20 }}>
        <Card>
          <SectionLabel as="h2">The last 4 weeks</SectionLabel>
          <ListRow
            variant="compact"
            title="Weight increases"
            value={String(ups.length)}
            valueMono
          />
          <ListRow
            variant="compact"
            title="Lifts stalled now"
            value={stalled.length ? stalled.map(nameOf).join(', ') : 'None'}
            {...(stalled.length ? { valueTone: 'warning' as const } : {})}
          />
          <ListRow
            variant="compact"
            title="Next planned deload"
            value={block.plannedDeload ? 'This week' : `Week ${nextDeload}`}
          />
          <ListRow
            variant="compact"
            title="Changes you decided"
            value={String(decided.length)}
            valueMono
          />
        </Card>
        <p className={s['lede']}>
          From P2, your own Claude reads this and proposes a weekly review, checked against the same
          rules. Nothing changes without your say.
        </p>
        <RulesRunning />
      </main>
    </>
  );
}

// Offered changes on Today (decision #87): stall steps, deloads and extra sets wait for Accept
// or Keep (with an optional reason). Each cites its rules. The wording is ours; the rule decides.
import { displayName, exercise, rule } from '@tare/data';
import { ChangeCard, SectionHeader, TextLink, type ChangeKind } from '@tare/ui';
import { useEffect } from 'react';
import { useAppData } from '../data/DbContext.tsx';
import type { ChangeRecord } from '../db/index.ts';
import { mondayOf } from '../lib/dates.ts';
import { acceptOffer, ensureOffers, keepOffer } from '../plan/actions.ts';
import type { PlanState } from '../plan/usePlanTargets.ts';
import s from './screens.module.css';

const REASONS = [
  { value: 'feel_fine', label: 'I feel fine' },
  { value: 'not_now', label: 'Not this week' },
  { value: 'other', label: 'Something else' },
];

const kg = (n: number | null | undefined) =>
  n == null ? '—' : `${Number.isInteger(n) ? n : n.toFixed(1)} kg`;

function describe(c: ChangeRecord): {
  kind: ChangeKind;
  title: string;
  from: string;
  to: string;
  why: string;
} {
  const name = c.exerciseId ? displayName(exercise(c.exerciseId)) : '';
  if (c.kind === 'stall') {
    if (c.detail === 'step1') {
      return {
        kind: 'hold',
        title: name,
        from: 'Stalled',
        to: 'Deload this week',
        why: `${name} hasn’t moved for a few sessions and your recent sessions felt hard. Recovery first: an easier week.`,
      };
    }
    if (c.detail === 'step3') {
      return {
        kind: 'hold',
        title: name,
        from: 'Stalled again',
        to: 'Swap or new rep range',
        why: `${name} stalled again after a reset. Try a swap with the same movement, or a different rep range.`,
      };
    }
    return {
      kind: 'hold',
      title: name,
      from: kg(c.from['load']),
      to: kg(c.to['load']),
      why: `${name} hasn’t moved for a few sessions. Drop the weight a little and build back up.`,
    };
  }
  if (c.kind === 'deload') {
    const why: Record<string, string> = {
      planned: 'The end of a training block.',
      stalled_lifts: 'Several lifts stalled this week.',
      hard_sessions: 'Most sessions felt Tough or Wrecked for two weeks.',
      wrecked_sessions: 'Two or more Wrecked sessions in two weeks.',
    };
    return {
      kind: 'hold',
      title: 'Deload week',
      from: 'Full sessions',
      to: 'Fewer sets, easier',
      why: `${why[c.detail ?? ''] ?? ''} A lighter week to manage fatigue.`,
    };
  }
  return {
    kind: 'volume',
    title: 'More sets',
    from: `${c.from['sets'] ?? ''} sets a week`,
    to: `${c.to['sets'] ?? ''} sets a week`,
    why: 'A new block, and recovery looks good: a few more sets, within your goal’s range.',
  };
}

export function Offers({ state, today }: { state: PlanState; today: string }) {
  const data = useAppData();
  useEffect(() => {
    void ensureOffers(data, state.offers);
  }, [data, state.offers]);

  // Open offers, and ones decided this week (so a decision can be seen and undone).
  const weekStart = mondayOf(today);
  const shown = state.snap.changes.filter(
    (c) =>
      (c.kind === 'stall' || c.kind === 'deload' || c.kind === 'volume') &&
      (c.status === 'offered' || c.date >= weekStart),
  );
  if (!shown.length) return null;
  const open = shown.filter((c) => c.status === 'offered').length;

  return (
    <div className={s['stack']}>
      <SectionHeader title="Suggested changes" meta={open ? `${open} to decide` : 'All decided'} />
      {shown.map((c) => {
        const d = describe(c);
        return (
          <ChangeCard
            key={c.id}
            kind={d.kind}
            exercise={d.title}
            from={d.from}
            to={d.to}
            rationale={d.why}
            rules={c.ruleIds.map((id) => rule(id))}
            state={c.status === 'offered' ? 'pending' : c.status === 'kept' ? 'kept' : 'accepted'}
            reasonOptions={REASONS}
            keepReason={c.keepReason}
            onAccept={() => void acceptOffer(data, c, today)}
            onKeep={() => void keepOffer(data, c, null)}
            onReason={(r) => void keepOffer(data, c, r)}
            onUndo={() => void data.r.changes.decide(c.id, 'offered')}
          />
        );
      })}
      {shown.some((c) => c.detail === 'step3' && c.status === 'accepted' && c.exerciseId) ? (
        <TextLink
          href={`/exercise/${encodeURIComponent(shown.find((c) => c.detail === 'step3')?.exerciseId ?? '')}`}
        >
          Choose a swap
        </TextLink>
      ) : null}
    </div>
  );
}

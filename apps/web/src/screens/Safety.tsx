// A safety result (boards Safety-*): the rule's user_message word for word, its services for
// the user's nation, and what to do next with the workout. Only the fixed action labels and
// buttons are ours; the engine picked the rule and nothing here can change it (hard line 3).
import { exercise, displayName, safetyRules, services } from '@tare/data';
import { Button, RemovedItemList, SafetyScreen, type Region, type ServiceData } from '@tare/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { useAppData } from '../data/DbContext.tsx';
import { useProfile, useUnfinishedWorkout } from '../data/hooks.ts';
import { humanArea } from '../safety/PainForm.tsx';

const STOPS = new Set(['stop_now_call_999', 'stop_and_contact_111', 'stop_and_see_gp']);

export function Safety() {
  const { ruleId } = useParams();
  const [params] = useSearchParams();
  const flagId = params.get('flag');
  const { r } = useAppData();
  const profile = useProfile();
  const workout = useUnfinishedWorkout();
  const flag = useLiveQuery(
    async () => (flagId ? ((await r.painFlags.all()).find((f) => f.id === flagId) ?? null) : null),
    [r, flagId],
  );
  const rule = safetyRules().find((x) => x.id === ruleId);
  if (!rule) return <Navigate to="/" replace />;
  if (profile === undefined || workout === undefined || flag === undefined) {
    return <main aria-busy="true" aria-label="Loading" />;
  }

  const inWorkout = workout !== null;
  const skipped = flag?.skippedExerciseIds ?? [];
  const where =
    flag?.area && flag.side && flag.side !== 'both'
      ? `${flag.side} ${flag.area}`
      : (flag?.area ?? 'that area');

  let actions;
  if (!inWorkout) {
    actions = (
      <Button variant="secondary-outline" size={52} fullWidth href="/">
        Done
      </Button>
    );
  } else if (rule.action === 'modify_exercise') {
    actions = (
      <>
        <Button variant="swap" fullWidth href="/workout">
          Continue with changes
        </Button>
        <Button variant="secondary-outline" size={52} fullWidth href="/workout/finish">
          End session
        </Button>
      </>
    );
  } else if (rule.action === 'continue_with_caution') {
    actions = (
      <Button fullWidth href="/workout">
        Back to workout
      </Button>
    );
  } else if (STOPS.has(rule.action)) {
    actions = (
      <Button variant="secondary-outline" size={52} fullWidth href="/workout/finish">
        End session
      </Button>
    );
  } else {
    actions = (
      <>
        <Button fullWidth href="/workout/finish">
          End session
        </Button>
        <Button variant="secondary-outline" size={52} fullWidth href="/workout">
          Back to workout
        </Button>
      </>
    );
  }

  return (
    <main style={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
      <SafetyScreen
        rule={rule}
        services={services() as unknown as Record<string, ServiceData>}
        region={(profile?.region ?? 'england') as Region}
        actions={actions}
      >
        {skipped.length ? (
          <RemovedItemList
            label={`Skipped today (they load your ${humanArea(where).toLowerCase()})`}
            items={skipped.map((id) => displayName(exercise(id)))}
          />
        ) : null}
      </SafetyScreen>
    </main>
  );
}

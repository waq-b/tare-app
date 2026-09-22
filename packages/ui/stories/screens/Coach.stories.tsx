// Boards: Coach-Review, Coach-Review-Light, Coach-Reject, Coach-Early, Coach-None.
import { displayName, exercise, labelFromId, rule } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { review, shortDate } from '../../fixtures';
import { BottomNav } from '../../src/components/BottomNav/BottomNav';
import { Button } from '../../src/components/Button/Button';
import { Card } from '../../src/components/Card/Card';
import { ChangeCard, type DecisionState } from '../../src/components/ChangeCard/ChangeCard';
import { EmptyState } from '../../src/components/EmptyState/EmptyState';
import { IconButton } from '../../src/components/IconButton/IconButton';
import { ListRow } from '../../src/components/ListRow/ListRow';
import { ReviewSummaryCard } from '../../src/components/ReviewSummaryCard/ReviewSummaryCard';
import { SectionHeader } from '../../src/components/SectionHeader/SectionHeader';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { StepProgress } from '../../src/components/StepProgress/StepProgress';
import { TextLink } from '../../src/components/TextLink/TextLink';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Coach', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const REASONS = [
  { value: 'too_heavy', label: 'Too heavy' },
  { value: 'dont_like', label: 'Don’t like it' },
  { value: 'no_kit', label: 'No kit' },
];
const cardProps = (c: (typeof review.changes)[number]) => ({
  kind: c.kind,
  exercise: displayName(exercise(c.exerciseId)),
  from: c.from,
  to: c.to,
  rationale: c.rationale,
  rules: c.ruleIds.map((r) => rule(r)),
  reasonOptions: REASONS,
});

function Review() {
  const [state, setState] = useState<Record<string, { s: DecisionState; r: string | null }>>(
    Object.fromEntries(review.changes.map((c) => [c.id, { s: c.state, r: c.keepReason ?? null }])),
  );
  const left = Object.values(state).filter((x) => x.s === 'pending').length;
  const set = (id: string, s2: DecisionState, r: string | null = null) =>
    setState({ ...state, [id]: { s: s2, r } });
  return (
    <ScreenFrame>
      <TopBar
        title="Coach"
        subtitle="Weekly review"
        actions={<IconButton icon="more" label="More" />}
      />
      <ScreenBody gap={14}>
        <ReviewSummaryCard
          week={`Week ${review.week} · ${shortDate(review.weekStart).slice(4)}–${shortDate(review.weekEnd).slice(4)}`}
          sessions={`${review.sessionsDone} of ${review.sessionsPlanned} sessions`}
          summary={review.summary}
          writtenAt="Sun 20 Sep, 19:02"
        />
        <SectionHeader
          title="Proposed changes"
          meta={left ? `${left} left to decide` : 'All decided'}
        />
        {review.changes.map((c) => (
          <ChangeCard
            key={c.id}
            {...cardProps(c)}
            state={state[c.id]!.s}
            keepReason={state[c.id]!.r}
            onAccept={() => set(c.id, 'accepted')}
            onKeep={() => set(c.id, 'kept')}
            onUndo={() => set(c.id, 'pending')}
            onReason={(r) => set(c.id, 'kept', r)}
          />
        ))}
        <p className={s['lede']} style={{ fontSize: 13 }}>
          Nothing changes until you accept it. Every change cites the rule it follows.
        </p>
      </ScreenBody>
      <BottomNav active="coach" />
    </ScreenFrame>
  );
}

export const WeeklyReview: Story = { name: 'Weekly review', render: () => <Review /> };
export const WeeklyReviewLight: Story = {
  name: 'Weekly review (light)',
  globals: { theme: 'light' },
  render: () => <Review />,
};

export const KeptWithReason: Story = {
  name: 'Kept with reason',
  render: () => {
    const c = review.changes.find((x) => x.state === 'kept')!;
    return (
      <ScreenFrame>
        <TopBar title="Coach" subtitle="Weekly review" />
        <ScreenBody gap={14}>
          <SectionHeader title="Proposed changes" meta="All decided" />
          <ChangeCard {...cardProps(c)} state="kept" keepReason={c.keepReason ?? null} />
        </ScreenBody>
        <BottomNav active="coach" />
      </ScreenFrame>
    );
  },
};

const RAMP = rule('pr.new_user_ramp');
const RULES_RUNNING = ['pr.double_progression', 'pr.stall', 'pr.deload'];

export const NotEnoughData: Story = {
  name: 'Not enough data',
  render: () => (
    <ScreenFrame>
      <TopBar title="Coach" />
      <ScreenBody gap={20}>
        <EmptyState
          layout="left"
          icon={<Icon name="coach" size={28} />}
          title="Not enough data yet."
          extra={
            <StepProgress
              total={4}
              done={2}
              current={2}
              label="Week 3 of 4 before your first review"
              labels={['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']}
            />
          }
        >
          {String(RAMP.raw['rule'])}
        </EmptyState>
        <Card>
          <SectionLabel as="h2">Rules running now</SectionLabel>
          {RULES_RUNNING.map((id) => {
            const r = rule(id).raw;
            const text = String(r['trigger'] ?? r['definition'] ?? r['method'] ?? '');
            return (
              <ListRow
                key={id}
                title={labelFromId(id).charAt(0).toUpperCase() + labelFromId(id).slice(1)}
                subtitle={text}
              />
            );
          })}
          <TextLink href="#" chevron>
            See the rulebook
          </TextLink>
        </Card>
      </ScreenBody>
      <BottomNav active="coach" />
    </ScreenFrame>
  ),
};

export const MissedRun: Story = {
  name: 'Missed run',
  render: () => (
    <ScreenFrame>
      <TopBar title="Coach" />
      <ScreenBody gap={20}>
        <EmptyState
          layout="left"
          icon={<Icon name="refresh" size={28} />}
          title="No review this week."
          extra={
            <div>
              <ListRow title="Last successful run" value="Sun 13 Sep, 19:02" valueMono />
              <ListRow title="Missed" value="Sun 20 Sep" valueMono valueTone="warning" />
              <ListRow title="Connection" value="OK" valueTone="progress" />
            </div>
          }
          actions={
            <>
              <Button icon={<Icon name="copy" size={20} />} fullWidth>
                Copy prompt to run it in Claude
              </Button>
              <Button variant="secondary-outline" size={52} fullWidth>
                Check connection
              </Button>
            </>
          }
        >
          The scheduled review didn’t run. Your plan carries on under the rules.
        </EmptyState>
      </ScreenBody>
      <BottomNav active="coach" />
    </ScreenFrame>
  ),
};

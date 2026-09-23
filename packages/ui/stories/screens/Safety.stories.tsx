// Boards: Safety-Caution, -Modify, -Rest, -GP, -111, -111-Light, -999, Pain-Flag (redesigned), Health-Flags.
import { safetyRule, safetyRules, services } from '@tare/data';
import { BodyMap, type BodyArea } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { painFlags, profile, shortDate } from '../../fixtures';
import { Button } from '../../src/components/Button/Button';
import { DataTable } from '../../src/components/Charts/Table';
import { Checkbox } from '../../src/components/Checkbox/Checkbox';
import { ChoiceChip } from '../../src/components/ChoiceChip/ChoiceChip';
import { ExerciseHeader } from '../../src/components/ExerciseHeader/ExerciseHeader';
import { Legend } from '../../src/components/Legend/Legend';
import { RadioCard } from '../../src/components/RadioCard/RadioCard';
import { RemovedItemList, EmergencyShortcut } from '../../src/components/SafetyBits/SafetyBits';
import { SafetyLockNote } from '../../src/components/SafetyLockNote/SafetyLockNote';
import { SAFETY_LEVELS, SafetyScreen } from '../../src/components/SafetyScreen/SafetyScreen';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { SegmentedControl } from '../../src/components/SegmentedControl/SegmentedControl';
import { Sheet } from '../../src/components/Sheet/Sheet';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { WorkoutTopBar } from '../../src/components/WorkoutTopBar/WorkoutTopBar';
import type { ServiceData } from '../../src/lib/services';
import { bench, musclesLine, name, pattern, sessionB } from './data';
import { routePainFlag, SIGNS, TIMINGS, type PainSign, type PainTiming } from '@tare/engine';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';
import { vpt, exercisesLoading } from '@tare/data';

const meta = { title: 'Screens/Safety', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<{ ruleId: string }>;

const svc = services() as unknown as Record<string, ServiceData>;
const human = (t: string) => (t.charAt(0).toUpperCase() + t.slice(1)).replace(/_/g, ' ');

function Safety({ ruleId, extra }: { ruleId: string; extra?: React.ReactNode }) {
  return (
    <ScreenFrame>
      <ScreenBody gap={0}>
        <div style={{ margin: '0 -20px' }}>
          <SafetyScreen
            rule={safetyRule(ruleId)}
            services={svc}
            region={profile.region}
            actions={extra}
          >
            {null}
          </SafetyScreen>
        </div>
      </ScreenBody>
    </ScreenFrame>
  );
}

/** One story per action, with a control to switch to any rule for that action. */
const forAction = (action: string, preferred?: string): Story => {
  const ids = safetyRules()
    .filter((r) => r.action === action)
    .map((r) => r.id);
  return {
    args: { ruleId: preferred ?? ids[0]! },
    argTypes: { ruleId: { control: 'select', options: ids, name: 'Rule' } },
    render: ({ ruleId }) => <Safety ruleId={ruleId} />,
  };
};

export const ContinueWithCaution: Story = {
  name: 'Continue with caution',
  ...forAction('continue_with_caution', 'doms_normal'),
};

/** pain_during_exercise's engine action: skip moves where the flagged area is primary. */
const skipped = (area: string) =>
  sessionB.exercises
    .map((e) => e.exerciseId)
    .filter((id) => exercisesLoading(area, 'primary').includes(id))
    .map(name);

export const ModifyExercise: Story = {
  name: 'Modify exercise',
  ...forAction('modify_exercise', 'pain_during_exercise'),
  render: ({ ruleId }) => (
    <Safety
      ruleId={ruleId}
      extra={
        <>
          {ruleId === 'pain_during_exercise' ? (
            <RemovedItemList
              label="Skipped today (they load your right shoulder)"
              items={skipped('shoulder')}
            />
          ) : null}
          <Button variant="swap" fullWidth>
            Continue with changes
          </Button>
          <Button variant="secondary-outline" size={52} fullWidth>
            End session
          </Button>
        </>
      }
    />
  ),
};
export const ReduceOrRest: Story = {
  name: 'Reduce or rest',
  ...forAction('reduce_or_rest', 'suspected_sprain_strain'),
};
export const SeeGP: Story = { name: 'See GP', ...forAction('stop_and_see_gp', 'pain_not_doms') };
export const Contact111: Story = {
  name: 'Contact 111',
  ...forAction('stop_and_contact_111', 'injury_cant_bear_weight'),
};
export const Contact111Light: Story = {
  name: 'Contact 111 (light)',
  globals: { theme: 'light' },
  ...forAction('stop_and_contact_111', 'injury_cant_bear_weight'),
};
export const Call999: Story = {
  name: 'Call 999',
  ...forAction('stop_now_call_999', 'chest_pain_emergency'),
};

function PainFlagSheet() {
  const [area, setArea] = useState<string | null>('shoulder');
  const [side, setSide] = useState('right');
  const [timing, setTiming] = useState<PainTiming | null>(null);
  const [signs, setSigns] = useState<PainSign[]>([]);
  const [unsure, setUnsure] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const routed = routePainFlag({ area, timing, signs, unsure });
  const sided = vpt().enums.body_area_sided;

  if (result) return <Safety ruleId={result} />;
  return (
    <ScreenFrame>
      <WorkoutTopBar
        sessionName={sessionB.name}
        elapsed="12:40"
        minimiseHref="#"
        flagPainHref="#"
      />
      <ScreenBody>
        <ExerciseHeader
          name={name(bench.exerciseId)}
          muscles={musclesLine(bench.exerciseId)}
          pattern={pattern(bench.exerciseId)}
        />
      </ScreenBody>
      <Sheet
        open
        height="tall"
        title="Flag pain"
        onClose={() => undefined}
        footer={
          <Button size={60} fullWidth disabled={!routed} onClick={() => setResult(routed)}>
            Continue
          </Button>
        }
      >
        <EmergencyShortcut
          label="Chest pain, or struggling to breathe?"
          onClick={() => setResult('chest_pain_emergency')}
        />
        <div className={s['stack']}>
          <SectionLabel as="h3">Where?</SectionLabel>
          <div
            role="group"
            aria-label="Where does it hurt?"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
          >
            {vpt().enums.body_areas.map((a) => (
              <ChoiceChip
                key={a}
                selected={area === a}
                onToggle={() => setArea(area === a ? null : a)}
              >
                {human(a)}
              </ChoiceChip>
            ))}
          </div>
          {area && sided.includes(area) ? (
            <SegmentedControl
              label="Which side?"
              tone="neutral"
              value={side}
              onChange={setSide}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
                { value: 'both', label: 'Both' },
              ]}
            />
          ) : null}
        </div>
        <fieldset className={s['stack']} style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ padding: 0, marginBottom: 8 }}>
            <SectionLabel as="div">When?</SectionLabel>
          </legend>
          {TIMINGS.map((t) => (
            <RadioCard
              key={t.value}
              name="timing"
              value={t.value}
              title={t.title}
              hint={t.hint}
              checked={timing === t.value}
              onChange={(v) => setTiming(v as PainTiming)}
            />
          ))}
        </fieldset>
        <div className={s['stack']}>
          <SectionLabel as="h3">Any of these?</SectionLabel>
          {SIGNS.filter((x) => !x.onlyFor || x.onlyFor === area).map((x) => (
            <Checkbox
              key={x.sign}
              label={x.text}
              checked={signs.includes(x.sign)}
              onChange={(c) => setSigns(c ? [...signs, x.sign] : signs.filter((y) => y !== x.sign))}
            />
          ))}
          <Checkbox label="I’m not sure if it’s serious" checked={unsure} onChange={setUnsure} />
        </div>
      </Sheet>
    </ScreenFrame>
  );
}

export const PainFlagSheetStory: Story = {
  name: 'Pain flag sheet',
  render: () => <PainFlagSheet />,
};

/** Sharp shoulder pain during a set → pain_during_exercise → Modify. */
export const PainFlagDuringSet: Story = {
  name: 'Pain flag · sharp during a set',
  globals: { theme: 'dark' },
  render: () => <PainFlagSheet />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('radio', { name: /came on during a set/ }));
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await expect(c.getByRole('heading', { level: 1 })).toHaveTextContent(
      SAFETY_LEVELS['modify_exercise']!.title,
    );
    await expect(c.getByTestId('safety-message')).toHaveTextContent(
      safetyRule('pain_during_exercise').user_message,
    );
  },
};

/** Hot, swollen calf → calf_hot_swollen → 999. */
export const PainFlagHotCalf: Story = {
  name: 'Pain flag · hot swollen calf',
  globals: { theme: 'dark' },
  render: () => <PainFlagSheet />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Calf' }));
    await userEvent.click(c.getByRole('checkbox', { name: /calf is hot/ }));
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await expect(c.getByTestId('safety-message')).toHaveTextContent(
      safetyRule('calf_hot_swollen').user_message,
    );
    await expect(c.getAllByRole('link')[0]).toHaveAttribute('href', 'tel:999');
  },
};

export const PainFlagHistory: Story = {
  name: 'Pain flag history',
  render: () => {
    const rows = painFlags.map((f) => ({
      date: shortDate(f.date).slice(4),
      area: human(`${f.side === 'both' ? '' : `${f.side} `}${f.area}`),
      result: SAFETY_LEVELS[safetyRule(f.ruleId).action]?.eyebrow ?? '',
      status: f.status === 'active' ? 'Active' : `Cleared ${shortDate(f.clearedOn!).slice(4)}`,
    }));
    const flags = painFlags.map((f) => ({
      area: f.area as BodyArea,
      side: f.side,
      state: f.status,
    }));
    return (
      <ScreenFrame>
        <TopBar
          back={{ href: '#' }}
          title="Pain flags"
          subtitle={`${painFlags.length} flags · ${painFlags.filter((f) => f.status === 'active').length} active`}
        />
        <ScreenBody gap={20}>
          <DataTable
            caption="Pain flags"
            columns={[
              { key: 'date', label: 'Date', rowHeader: true },
              { key: 'area', label: 'Area' },
              { key: 'result', label: 'Result' },
              { key: 'status', label: 'Status' },
            ]}
            rows={rows}
          />
          <SafetyLockNote>
            Results come from the safety rules. Your coach reads this list but can’t edit it.
          </SafetyLockNote>
          <div className={s['stack']}>
            <SectionLabel>Where it’s been</SectionLabel>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
              <BodyMap view="front" flags={flags} width={80} title="Pain flags, front" />
              <BodyMap view="back" flags={flags} width={80} title="Pain flags, back" />
            </div>
            <Legend
              label="Body map key"
              items={[
                { label: 'Active', color: 'var(--muscle-primary)' },
                { label: 'Cleared', color: 'var(--muscle-secondary)' },
              ]}
            />
          </div>
        </ScreenBody>
      </ScreenFrame>
    );
  },
};

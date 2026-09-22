// Boards: Onb-Welcome, Onb-Health, Onb-GP (one story per result), Onb-Goals, Onb-Kit.
// Questions and messages come word for word from safety_rules.json → screening.
import { screening, services, vpt } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { profile, screeningAnswers, screeningArea } from '../../fixtures';
import { MiniquestTag, Wordmark } from '../../src/components/Brand/Brand';
import { Button } from '../../src/components/Button/Button';
import { Checkbox } from '../../src/components/Checkbox/Checkbox';
import { ChoiceChip } from '../../src/components/ChoiceChip/ChoiceChip';
import { FieldButton } from '../../src/components/FieldButton/FieldButton';
import { QuestionRow } from '../../src/components/QuestionRow/QuestionRow';
import { RankedChoice } from '../../src/components/RankedChoice/RankedChoice';
import { DisclaimerCard } from '../../src/components/SafetyBits/SafetyBits';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { SegmentedControl } from '../../src/components/SegmentedControl/SegmentedControl';
import { StatusHero } from '../../src/components/StatusHero/StatusHero';
import { Tag } from '../../src/components/Tag/Tag';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { serviceActions, type ServiceData } from '../../src/lib/services';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Onboarding', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const sc = screening();
const human = (tag: string) => {
  const t = tag.replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const steps = (n: number) => ({ total: 5, done: n, label: `Step ${n} of 5` });

export const Welcome: Story = {
  render: () => (
    <ScreenFrame>
      <ScreenBody gap={24}>
        <div style={{ paddingTop: 72 }} className={s['stack']}>
          <MiniquestTag />
          <Wordmark size={60} />
          <p className={s['lede']}>
            Log sets fast. Get an honest plan. Nothing changes without your say.
          </p>
        </div>
        <DisclaimerCard title="Not medical advice">
          Tare helps you plan and log training. It can’t diagnose anything. If something feels
          wrong, the safety rules point you to the NHS.
        </DisclaimerCard>
        <div style={{ marginTop: 'auto' }} className={s['stack']}>
          <Button size={60} fullWidth>
            I understand, let’s start
          </Button>
          <p className={s['lede']} style={{ textAlign: 'center', fontSize: 13 }}>
            Takes about 2 minutes
          </p>
        </div>
      </ScreenBody>
    </ScreenFrame>
  ),
};

export const Health: Story = {
  render: function Render() {
    const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | null>>({
      ...screeningAnswers,
    });
    const [areas, setAreas] = useState<string[]>([screeningArea.area]);
    const [side, setSide] = useState<string>(screeningArea.side);
    const sided = vpt().enums.body_area_sided;
    return (
      <ScreenFrame>
        <TopBar back={{ href: '#' }} progress={steps(1)} />
        <ScreenBody gap={4}>
          <h1 className={s['h2']}>A few health questions</h1>
          <p className={s['lede']}>
            They decide how we start. Your answers sync to your account so the safety rules can use
            them.
          </p>
          {sc.questions.map((q, i) => (
            <QuestionRow
              key={q.id}
              number={i + 1}
              question={q.text}
              value={answers[q.id] ?? null}
              onChange={(v) => setAnswers({ ...answers, [q.id]: v })}
              followUp={
                q.type === 'yes_no_with_area' ? (
                  <div className={s['stack']}>
                    <SectionLabel as="div">Which area?</SectionLabel>
                    <div
                      role="group"
                      aria-label="Which area?"
                      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                    >
                      {vpt().enums.body_areas.map((a) => (
                        <ChoiceChip
                          key={a}
                          selected={areas.includes(a)}
                          onToggle={() =>
                            setAreas(
                              areas.includes(a) ? areas.filter((x) => x !== a) : [...areas, a],
                            )
                          }
                        >
                          {human(a)}
                        </ChoiceChip>
                      ))}
                    </div>
                    {areas.some((a) => sided.includes(a)) ? (
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
                ) : undefined
              }
            />
          ))}
          <div style={{ paddingTop: 16 }}>
            <Button size={60} fullWidth>
              Continue
            </Button>
          </div>
        </ScreenBody>
      </ScreenFrame>
    );
  },
};

/** Fixed UI labels per screening result; the message is the data's, verbatim. */
const RESULT: Record<
  string,
  {
    title: string;
    tone: 'warning' | 'swap' | 'accent' | 'hold';
    icon: 'alert' | 'swap' | 'check' | 'info';
  }
> = {
  medical_clearance_first: { title: 'Check with your GP first.', tone: 'warning', icon: 'alert' },
  modify: { title: 'We’ll work around it.', tone: 'swap', icon: 'swap' },
  start_light_to_moderate: { title: 'We’ll start gently.', tone: 'accent', icon: 'check' },
  continue_moderate: { title: 'Keep it moderate for now.', tone: 'hold', icon: 'info' },
  continue_progress_as_tolerated: { title: 'You’re all set.', tone: 'accent', icon: 'check' },
};

function Result({ result }: { result: string }) {
  const r = RESULT[result]!;
  const gpFirst = result === 'medical_clearance_first';
  return (
    <ScreenFrame>
      <TopBar back={{ href: '#' }} progress={steps(1)} />
      <ScreenBody gap={20}>
        <StatusHero icon={<Icon name={r.icon} size={28} />} tone={r.tone} title={r.title}>
          {sc.result_messages[result]}
        </StatusHero>
        {result === 'modify' ? (
          <div className={s['row']}>
            <Tag tone="swap">{human(`${screeningArea.side} ${screeningArea.area}`)} noted</Tag>
          </div>
        ) : null}
        {gpFirst ? (
          <QuestionRow number={1} question={sc.cleared_by_gp.question.text} value={null} />
        ) : null}
        <div style={{ marginTop: 'auto' }} className={s['stack']}>
          {gpFirst ? null : (
            <Button size={60} fullWidth>
              Continue setup
            </Button>
          )}
          <Button variant="secondary-outline" size={52} fullWidth>
            Change my answers
          </Button>
        </div>
      </ScreenBody>
    </ScreenFrame>
  );
}

export const ResultMedicalClearance: Story = {
  name: 'Screening result · medical_clearance_first',
  render: () => <Result result="medical_clearance_first" />,
};
export const ResultModify: Story = {
  name: 'Screening result · modify',
  render: () => <Result result="modify" />,
};
export const ResultStartLight: Story = {
  name: 'Screening result · start_light_to_moderate',
  render: () => <Result result="start_light_to_moderate" />,
};
export const ResultModerate: Story = {
  name: 'Screening result · continue_moderate',
  render: () => <Result result="continue_moderate" />,
};
export const ResultAllSet: Story = {
  name: 'Screening result · continue_progress_as_tolerated',
  render: () => <Result result="continue_progress_as_tolerated" />,
};

export const ClearedByGpYes: Story = {
  name: 'Screening result · cleared by GP',
  render: () => (
    <ScreenFrame>
      <TopBar back={{ href: '#' }} progress={steps(1)} />
      <ScreenBody gap={20}>
        <StatusHero
          icon={<Icon name="check" size={28} />}
          tone="accent"
          title="We’ll start gently."
        >
          {sc.cleared_by_gp.if_yes.message}
        </StatusHero>
        <FieldButton
          label="Anything your GP asked you to avoid? · optional"
          placeholder="Add a note"
        />
        <div style={{ marginTop: 'auto' }}>
          <Button size={60} fullWidth>
            Continue setup
          </Button>
        </div>
      </ScreenBody>
    </ScreenFrame>
  ),
};

export const ClearedByGpNo: Story = {
  name: 'Screening result · not cleared yet',
  render: () => {
    const offers = sc.cleared_by_gp.if_no['offer'] as string[];
    const links = serviceActions(
      offers,
      services() as unknown as Record<string, ServiceData>,
      profile.region,
    );
    return (
      <ScreenFrame>
        <TopBar back={{ href: '#' }} progress={steps(1)} />
        <ScreenBody gap={20}>
          <StatusHero
            icon={<Icon name="alert" size={28} />}
            tone="warning"
            title="Check with your GP first."
          >
            {sc.cleared_by_gp.if_no.message}
          </StatusHero>
          <div className={s['stack']}>
            {links.map((l) => (
              <Button
                key={l.id}
                href={l.href}
                external={l.kind === 'web'}
                variant="secondary-outline"
                size={52}
                fullWidth
                icon={<Icon name={l.kind === 'tel' ? 'phone' : 'ext'} size={20} />}
              >
                {l.label}
              </Button>
            ))}
          </div>
          <div style={{ marginTop: 'auto' }} className={s['stack']}>
            <Button size={60} fullWidth>
              Save and remind me
            </Button>
            <Button variant="secondary-outline" size={52} fullWidth>
              Change my answers
            </Button>
          </div>
        </ScreenBody>
      </ScreenFrame>
    );
  },
};

const GOALS = [
  { value: 'fat_loss', label: 'Lose fat' },
  { value: 'hypertrophy', label: 'Build muscle' },
  { value: 'strength', label: 'Get stronger' },
  { value: 'endurance', label: 'Build endurance' },
  { value: 'general', label: 'General health' },
].filter((g) => vpt().training.goals.some((x) => x.goal === g.value));

export const Goals: Story = {
  render: function Render() {
    const [ranking, setRanking] = useState<string[]>(profile.goalsRanked.slice(0, 2));
    const [days, setDays] = useState(String(profile.daysPerWeek));
    const [length, setLength] = useState(String(profile.sessionMinutes));
    const [level, setLevel] = useState<string>(profile.level);
    return (
      <ScreenFrame>
        <TopBar back={{ href: '#' }} progress={steps(2)} />
        <ScreenBody gap={20}>
          <div className={s['stack']}>
            <h1 className={s['h2']}>What matters most?</h1>
            <p className={s['lede']}>
              Tap in order. First is your main goal, second shapes the rest.
            </p>
          </div>
          <RankedChoice
            label="Goals"
            options={GOALS}
            ranking={ranking}
            onToggle={(v) =>
              setRanking(ranking.includes(v) ? ranking.filter((x) => x !== v) : [...ranking, v])
            }
          />
          <div className={s['stack']}>
            <SectionLabel as="h2">Days per week</SectionLabel>
            <SegmentedControl
              label="Days per week"
              value={days}
              onChange={setDays}
              options={['2', '3', '4', '5'].map((d) => ({ value: d, label: d }))}
            />
          </div>
          <div className={s['stack']}>
            <SectionLabel as="h2">Session length</SectionLabel>
            <SegmentedControl
              label="Session length"
              value={length}
              onChange={setLength}
              options={['45', '60', '75'].map((m) => ({ value: m, label: `${m} min` }))}
            />
          </div>
          <div className={s['stack']}>
            <SectionLabel as="h2">Experience</SectionLabel>
            <SegmentedControl
              label="Experience"
              value={level}
              onChange={setLevel}
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
              ]}
            />
          </div>
          <Button size={60} fullWidth>
            Continue
          </Button>
        </ScreenBody>
      </ScreenFrame>
    );
  },
};

const KIT = [
  'barbell',
  'plates',
  'power_rack',
  'flat_bench',
  'adjustable_bench',
  'dumbbells',
  'kettlebell',
  'cable_stack',
  'lat_pulldown',
  'leg_press',
  'smith_machine',
  'calf_machine',
  'pull_up_bar',
  'dip_station',
];
const CANT = ['pull_up', 'chin_up', 'dip', 'pistol_squat', 'box_jump', 'muscle_up'];

export const Kit: Story = {
  render: function Render() {
    const [kit, setKit] = useState<string[]>(profile.kit);
    const [cant, setCant] = useState<string[]>(profile.cantDo);
    const [units, setUnits] = useState<string>(profile.units);
    const [db, setDb] = useState<string>(profile.dumbbellConvention);
    return (
      <ScreenFrame>
        <TopBar back={{ href: '#' }} progress={steps(3)} />
        <ScreenBody gap={20}>
          <h1 className={s['h2']}>Your gym</h1>
          <div className={s['stack']}>
            <SectionLabel as="h2">Kit you can use</SectionLabel>
            <div className={s['grid2']}>
              {KIT.filter((k) => vpt().enums.equipment_detail.includes(k)).map((k) => (
                <Checkbox
                  key={k}
                  variant="tile"
                  label={human(k)}
                  checked={kit.includes(k)}
                  onChange={(c) => setKit(c ? [...kit, k] : kit.filter((x) => x !== k))}
                />
              ))}
            </div>
          </div>
          <div className={s['stack']}>
            <SectionLabel as="h2">Can’t do yet</SectionLabel>
            <div
              role="group"
              aria-label="Can’t do yet"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
            >
              {CANT.filter((t) => vpt().enums.skill_tags.includes(t)).map((t) => (
                <ChoiceChip
                  key={t}
                  selected={cant.includes(t)}
                  onToggle={() =>
                    setCant(cant.includes(t) ? cant.filter((x) => x !== t) : [...cant, t])
                  }
                >
                  {human(t)}
                </ChoiceChip>
              ))}
            </div>
          </div>
          <div className={s['stack']}>
            <SectionLabel as="h2">Units</SectionLabel>
            <SegmentedControl
              label="Units"
              value={units}
              onChange={setUnits}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'lb', label: 'lb' },
              ]}
            />
          </div>
          <div className={s['stack']}>
            <SectionLabel as="h2">Dumbbells</SectionLabel>
            <SegmentedControl
              label="Log dumbbells"
              value={db}
              onChange={setDb}
              options={[
                { value: 'per_hand', label: 'Per hand' },
                { value: 'total', label: 'Total' },
              ]}
            />
          </div>
          <Button size={60} fullWidth>
            Build my plan
          </Button>
        </ScreenBody>
      </ScreenFrame>
    );
  },
};

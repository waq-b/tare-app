// Onboarding (boards Onb-Welcome, Onb-Health, Onb-GP, Onb-Goals, Onb-Kit) plus the
// starting-weights step (#69). Screening questions and messages are the data's, word for word;
// the result is the engine's (evaluateScreening). One route per step, so Back works.
import { exercise, displayName, screening, services, vpt } from '@tare/data';
import { evaluateScreening, type ScreeningOutcome } from '@tare/engine';
import { Icon } from '@tare/icons';
import {
  Banner,
  Button,
  Checkbox,
  ChoiceChip,
  DisclaimerCard,
  MiniquestTag,
  QuestionRow,
  RankedChoice,
  SectionLabel,
  SegmentedControl,
  serviceActions,
  StatusHero,
  Tag,
  TextField,
  TopBar,
  Wordmark,
  type ServiceData,
} from '@tare/ui';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useAppData } from '../../data/DbContext.tsx';
import { seedPlan, SEED_DAYS, uniqueExercises } from '../../seed/plan.ts';
import s from '../screens.module.css';
import { completeOnboarding, goalIdOf, saveScreening } from './complete.ts';
import { loadDraft, saveDraft, type Draft, type Region } from './draft.ts';

const STEPS = ['welcome', 'health', 'result', 'goals', 'kit', 'weights'] as const;
type Step = (typeof STEPS)[number];
const PROGRESS: Partial<Record<Step, number>> = {
  health: 1,
  result: 1,
  goals: 2,
  kit: 3,
  weights: 4,
};
const progress = (step: Step) => {
  const n = PROGRESS[step];
  return n ? { progress: { total: 4, done: n, label: `Step ${n} of 4` } } : {};
};
const prev = (step: Step) =>
  `/onboarding/${STEPS[Math.max(0, STEPS.indexOf(step) - 1)] ?? 'welcome'}`;

export const human = (tag: string) => {
  const t = tag.replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const REGIONS: { value: Region; label: string }[] = [
  { value: 'england', label: 'England' },
  { value: 'wales', label: 'Wales' },
  { value: 'scotland', label: 'Scotland' },
  { value: 'northern_ireland', label: 'Northern Ireland' },
];

/** The goals the data has, in our UI words. */
const GOALS = [
  { value: 'fat_loss', label: 'Lose fat' },
  { value: 'hypertrophy', label: 'Build muscle' },
  { value: 'strength', label: 'Get stronger' },
  { value: 'endurance', label: 'Build endurance' },
  { value: 'general', label: 'General health' },
];

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

const GP_FIRST = { title: 'Check with your GP first.', tone: 'warning', icon: 'alert' } as const;

/** Fixed UI labels per screening result; the message is the data's, verbatim. */
const RESULT: Record<
  string,
  {
    title: string;
    tone: 'warning' | 'swap' | 'accent' | 'hold';
    icon: 'alert' | 'swap' | 'check' | 'info';
  }
> = {
  medical_clearance_first: GP_FIRST,
  modify: { title: 'We’ll work around it.', tone: 'swap', icon: 'swap' },
  start_light_to_moderate: { title: 'We’ll start gently.', tone: 'accent', icon: 'check' },
  continue_moderate: { title: 'Keep it moderate for now.', tone: 'hold', icon: 'info' },
  continue_progress_as_tolerated: { title: 'You’re all set.', tone: 'accent', icon: 'check' },
};
const resultLabel = (r: string) => RESULT[r] ?? GP_FIRST;

export function outcomeOf(d: Draft): ScreeningOutcome | null {
  return evaluateScreening({
    answers: d.answers,
    mskAreas: d.mskAreas,
    ...(d.clearedByGp ? { clearedByGp: d.clearedByGp } : {}),
  });
}

export function Onboarding() {
  const { step = 'welcome' } = useParams();
  const { db } = useAppData();
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    void loadDraft(db).then(setDraft);
  }, [db]);
  useEffect(() => {
    if (draft) void saveDraft(db, draft);
  }, [db, draft]);

  if (!STEPS.includes(step as Step)) return <Navigate to="/onboarding/welcome" replace />;
  if (!draft) return <main aria-busy="true" aria-label="Loading" />;

  // Functional, so taps in quick succession each build on the last.
  const update: Update = (change) =>
    setDraft((d) => (d ? { ...d, ...(typeof change === 'function' ? change(d) : change) } : d));
  const props = { draft, update };
  const st = step as Step;

  // Steps after the result need a result that lets setup go on.
  const outcome = outcomeOf(draft);
  const blocked = !outcome || outcome.result === 'medical_clearance_first';
  if ((st === 'goals' || st === 'kit' || st === 'weights') && blocked) {
    return <Navigate to={outcome ? '/onboarding/result' : '/onboarding/health'} replace />;
  }

  return (
    <>
      {st === 'welcome' ? null : <TopBar back={{ href: prev(st) }} {...progress(st)} />}
      <main className={s['body']} style={{ gap: 20, paddingTop: st === 'welcome' ? 72 : 0 }}>
        {st === 'welcome' ? <Welcome {...props} /> : null}
        {st === 'health' ? <Health {...props} /> : null}
        {st === 'result' ? <Result {...props} /> : null}
        {st === 'goals' ? <Goals {...props} /> : null}
        {st === 'kit' ? <Kit {...props} /> : null}
        {st === 'weights' ? <Weights {...props} /> : null}
      </main>
    </>
  );
}

type Update = (change: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;

interface StepProps {
  draft: Draft;
  update: Update;
}

function Welcome({ update }: StepProps) {
  const navigate = useNavigate();
  return (
    <>
      <div className={s['stack']}>
        <MiniquestTag />
        <Wordmark size={60} />
        <p className={s['lede']}>
          Log sets fast. Get an honest plan. Nothing changes without your say.
        </p>
      </div>
      <DisclaimerCard title="Not medical advice">
        Tare helps you plan and log training. It can’t diagnose anything. If something feels wrong,
        the safety rules point you to the NHS.
      </DisclaimerCard>
      <div className={s['foot']}>
        <Button
          size={60}
          fullWidth
          onClick={() => {
            update({ acceptedDisclaimer: true });
            void navigate('/onboarding/health');
          }}
        >
          I understand, let’s start
        </Button>
        <p className={s['lede']} style={{ textAlign: 'center', fontSize: 13 }}>
          Takes about 2 minutes
        </p>
      </div>
    </>
  );
}

function Health({ draft, update }: StepProps) {
  const navigate = useNavigate();
  const sc = screening();
  const sided = vpt().enums.body_area_sided;
  const mskYes = draft.answers['msk_issue'] === 'yes';
  const needsSide = mskYes && draft.mskAreas.some((a) => sided.includes(a));
  const complete =
    sc.questions.every((q) => draft.answers[q.id]) &&
    (!mskYes || draft.mskAreas.length > 0) &&
    (!needsSide || draft.mskSide !== null);

  const toggleArea = (a: string) =>
    update((d) => ({
      mskAreas: d.mskAreas.includes(a) ? d.mskAreas.filter((x) => x !== a) : [...d.mskAreas, a],
    }));

  return (
    <>
      <div className={s['stack']}>
        <h1 className={s['h1']}>A few health questions</h1>
        <p className={s['lede']}>
          They decide how we start. Your answers sync to your account so the safety rules can use
          them.
        </p>
      </div>
      <div className={s['stack']}>
        <SectionLabel as="h2">Where you live</SectionLabel>
        <div role="group" aria-label="Where you live" className={s['chips']}>
          {REGIONS.map((r) => (
            <ChoiceChip
              key={r.value}
              selected={draft.region === r.value}
              onToggle={() => update({ region: r.value })}
            >
              {r.label}
            </ChoiceChip>
          ))}
        </div>
        <p className={s['lede']} style={{ fontSize: 14 }}>
          So we show the right NHS services.
        </p>
      </div>
      <div>
        {sc.questions.map((q, i) => (
          <QuestionRow
            key={q.id}
            number={i + 1}
            question={q.text}
            value={draft.answers[q.id] ?? null}
            onChange={(v) =>
              update((d) => ({
                answers: { ...d.answers, [q.id]: v },
                // A changed answer means the GP question is asked afresh.
                clearedByGp: null,
              }))
            }
            followUp={
              q.type === 'yes_no_with_area' ? (
                <div className={s['stack']}>
                  <SectionLabel as="div">Which area?</SectionLabel>
                  <div role="group" aria-label="Which area?" className={s['chips']}>
                    {vpt().enums.body_areas.map((a) => (
                      <ChoiceChip
                        key={a}
                        selected={draft.mskAreas.includes(a)}
                        onToggle={() => toggleArea(a)}
                      >
                        {human(a)}
                      </ChoiceChip>
                    ))}
                  </div>
                  {needsSide ? (
                    <SegmentedControl
                      label="Which side?"
                      tone="neutral"
                      value={draft.mskSide}
                      onChange={(v) => update({ mskSide: v })}
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
      </div>
      <div className={s['foot']}>
        <Button
          size={60}
          fullWidth
          disabled={!complete}
          onClick={() => void navigate('/onboarding/result')}
        >
          Continue
        </Button>
      </div>
    </>
  );
}

function Result({ draft, update }: StepProps) {
  const navigate = useNavigate();
  const data = useAppData();
  const [saved, setSaved] = useState(false);
  const outcome = outcomeOf(draft);
  if (!outcome) return <Navigate to="/onboarding/health" replace />;
  const sc = screening();
  const label = resultLabel(outcome.result);
  const gpFirst = outcome.result === 'medical_clearance_first';
  const clearedYes =
    draft.clearedByGp === 'yes' && outcome.ruleIds.includes('sf.screening.cleared_by_gp');
  const links = serviceActions(
    outcome.offer,
    services() as unknown as Record<string, ServiceData>,
    draft.region,
  );

  async function saveAnswers(o: ScreeningOutcome) {
    await saveScreening(data, draft, o);
    setSaved(true);
  }

  return (
    <>
      <StatusHero icon={<Icon name={label.icon} size={28} />} tone={label.tone} title={label.title}>
        {outcome.message}
      </StatusHero>
      {outcome.flagAreas.length ? (
        <div className={s['row']}>
          {outcome.flagAreas.map((a) => (
            <Tag key={a} tone="swap">
              {human(
                draft.mskSide && vpt().enums.body_area_sided.includes(a)
                  ? `${draft.mskSide} ${a}`
                  : a,
              )}{' '}
              noted
            </Tag>
          ))}
        </div>
      ) : null}
      {outcome.askClearedByGp ? (
        <QuestionRow
          number={1}
          question={sc.cleared_by_gp.question.text}
          value={draft.clearedByGp}
          onChange={(v) => update({ clearedByGp: v })}
        />
      ) : null}
      {clearedYes ? (
        <TextField
          label="Anything your GP asked you to avoid? · optional"
          value={draft.gpNote}
          onChange={(v) => update({ gpNote: v })}
          hint="Shown on your plan."
        />
      ) : null}
      {outcome.setupBlocked ? (
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
      ) : null}
      {saved ? (
        <Banner tone="success" title="Answers saved">
          Come back when your GP is happy, and carry on from here.
        </Banner>
      ) : null}
      <div className={s['foot']}>
        {gpFirst ? (
          outcome.setupBlocked && !saved ? (
            <Button size={60} fullWidth onClick={() => void saveAnswers(outcome)}>
              Save my answers
            </Button>
          ) : null
        ) : (
          <Button size={60} fullWidth onClick={() => void navigate('/onboarding/goals')}>
            Continue setup
          </Button>
        )}
        <Button variant="secondary-outline" size={52} fullWidth href="/onboarding/health">
          Change my answers
        </Button>
      </div>
    </>
  );
}

function Goals({ draft, update }: StepProps) {
  const navigate = useNavigate();
  const options = GOALS.filter((g) => vpt().training.goals.some((x) => x.goal === g.value));
  return (
    <>
      <div className={s['stack']}>
        <h1 className={s['h1']}>What matters most?</h1>
        <p className={s['lede']}>Tap in order. First is your main goal, second shapes the rest.</p>
      </div>
      <RankedChoice
        label="Goals"
        options={options}
        ranking={draft.goalsRanked}
        onToggle={(v) =>
          update((d) => ({
            goalsRanked: d.goalsRanked.includes(v)
              ? d.goalsRanked.filter((x) => x !== v)
              : [...d.goalsRanked, v].slice(0, 2),
          }))
        }
      />
      <div className={s['stack']}>
        <SectionLabel as="h2">Days per week</SectionLabel>
        <SegmentedControl
          label="Days per week"
          value={String(draft.daysPerWeek)}
          onChange={(v) => update({ daysPerWeek: Number(v) })}
          options={SEED_DAYS.map((d) => ({ value: String(d), label: String(d) }))}
        />
        <p className={s['lede']} style={{ fontSize: 14 }}>
          The starter plan has 2 or 3 sessions. More comes with the coach.
        </p>
      </div>
      <div className={s['stack']}>
        <SectionLabel as="h2">Session length</SectionLabel>
        <SegmentedControl
          label="Session length"
          value={String(draft.sessionMinutes)}
          onChange={(v) => update({ sessionMinutes: Number(v) })}
          options={['45', '60', '75'].map((m) => ({ value: m, label: `${m} min` }))}
        />
      </div>
      <div className={s['stack']}>
        <SectionLabel as="h2">Experience</SectionLabel>
        <SegmentedControl
          label="Experience"
          value={draft.level}
          onChange={(v) => update({ level: v })}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
          ]}
        />
      </div>
      <div className={s['foot']}>
        <Button
          size={60}
          fullWidth
          disabled={!draft.goalsRanked.length}
          onClick={() => void navigate('/onboarding/kit')}
        >
          Continue
        </Button>
      </div>
    </>
  );
}

function Kit({ draft, update }: StepProps) {
  const navigate = useNavigate();
  const { enums } = vpt();
  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  return (
    <>
      <h1 className={s['h1']}>Your gym</h1>
      <div className={s['stack']}>
        <SectionLabel as="h2">Kit you can use</SectionLabel>
        <div className={s['grid2']}>
          {KIT.filter((k) => enums.equipment_detail.includes(k)).map((k) => (
            <Checkbox
              key={k}
              variant="tile"
              label={human(k)}
              checked={draft.kit.includes(k)}
              onChange={() => update((d) => ({ kit: toggle(d.kit, k) }))}
            />
          ))}
        </div>
      </div>
      <div className={s['stack']}>
        <SectionLabel as="h2">Can’t do yet</SectionLabel>
        <div role="group" aria-label="Can’t do yet" className={s['chips']}>
          {CANT.filter((t) => enums.skill_tags.includes(t)).map((t) => (
            <ChoiceChip
              key={t}
              selected={draft.cantDo.includes(t)}
              onToggle={() => update((d) => ({ cantDo: toggle(d.cantDo, t) }))}
            >
              {human(t)}
            </ChoiceChip>
          ))}
        </div>
        <p className={s['lede']} style={{ fontSize: 14 }}>
          Weights are in kg, and dumbbells are logged per hand.
        </p>
      </div>
      <div className={s['foot']}>
        <Button size={60} fullWidth onClick={() => void navigate('/onboarding/weights')}>
          Build my plan
        </Button>
      </div>
    </>
  );
}

function draftSeed(d: Draft) {
  return seedPlan({
    goalId: goalIdOf(d.goalsRanked[0] ?? 'general'),
    daysPerWeek: d.daysPerWeek,
    kit: d.kit,
    cantDo: d.cantDo,
    avoidAreas: outcomeOf(d)?.flagAreas ?? [],
    startedOn: new Date().toISOString().slice(0, 10),
  });
}

function Weights({ draft, update }: StepProps) {
  const navigate = useNavigate();
  const data = useAppData();
  const [busy, setBusy] = useState(false);
  const { plan, changes } = draftSeed(draft);
  const ids = uniqueExercises(plan);
  const [text, setText] = useState<Record<string, string>>(() =>
    Object.fromEntries(ids.map((id) => [id, draft.startLoads[id]?.toString() ?? ''])),
  );

  const setLoad = (id: string, v: string) => {
    const clean = v.replace(',', '.').replace(/[^\d.]/g, '');
    setText({ ...text, [id]: clean });
    const n = Number(clean);
    const valid = clean !== '' && Number.isFinite(n) && n >= 0;
    update((d) => ({
      startLoads: {
        ...Object.fromEntries(Object.entries(d.startLoads).filter(([k]) => k !== id)),
        ...(valid ? { [id]: n } : {}),
      },
    }));
  };

  async function finish() {
    const outcome = outcomeOf(draft);
    if (!outcome) return;
    setBusy(true);
    await completeOnboarding(data, draft, outcome, plan);
    void navigate('/', { replace: true });
  }

  return (
    <>
      <div className={s['stack']}>
        <h1 className={s['h1']}>Starting weights</h1>
        <p className={s['lede']}>
          What you can lift for the reps, with a couple in reserve. Not sure? Leave it blank and
          start with an easy set to find it.
        </p>
      </div>
      {(['area', 'kit'] as const).map((why) => {
        const list = changes.filter((c) => c.why === why);
        if (!list.length) return null;
        return (
          <Banner
            key={why}
            tone="info"
            title={
              why === 'area'
                ? 'Changed to go easy on the area you told us about'
                : 'Changed for your kit'
            }
          >
            {list
              .map(
                (c) =>
                  `${displayName(exercise(c.exerciseId))} → ${c.to ? displayName(exercise(c.to)) : 'left out'}`,
              )
              .join('; ')}
          </Banner>
        );
      })}
      <div className={s['stack']}>
        {ids.map((id) => {
          const ex = exercise(id);
          if (ex.load_convention === 'bodyweight') return null;
          const perHand = ex.load_convention === 'per_hand';
          return (
            <TextField
              key={id}
              label={`${displayName(ex)} · kg${perHand ? ' per hand' : ''}`}
              inputMode="decimal"
              placeholder="Easy first set"
              value={text[id] ?? ''}
              onChange={(v) => setLoad(id, v)}
            />
          );
        })}
      </div>
      <div className={s['foot']}>
        <Button size={60} fullWidth disabled={busy} onClick={() => void finish()}>
          Start training
        </Button>
      </div>
    </>
  );
}

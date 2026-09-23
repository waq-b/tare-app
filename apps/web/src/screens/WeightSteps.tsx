// Settings → Weight steps (P1 T2): the smallest jump and lightest option per kind of kit. Every
// rounded load uses them: progression, warm-ups, swap and suggested starting weights, steppers.
import { Banner, Button, SectionLabel, TextField, TopBar } from '@tare/ui';
import type { KitKind } from '@tare/engine';
import { useState } from 'react';
import { useAppData } from '../data/DbContext.tsx';
import { useProfile } from '../data/hooks.ts';
import type { Profile } from '../db/index.ts';
import { KIT_KINDS, kitLoadOf } from '../settings/kit.ts';
import s from './screens.module.css';

export function WeightSteps() {
  const profile = useProfile();
  if (!profile) return <main aria-busy="true" aria-label="Loading" />;
  return <Form profile={profile} />;
}

const num = (t: string) => {
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function Form({ profile }: { profile: Profile }) {
  const { r } = useAppData();
  const [values, setValues] = useState(
    () =>
      Object.fromEntries(
        KIT_KINDS.map(({ kind }) => {
          const k = kitLoadOf(profile, kind);
          return [kind, { step: String(k.step), lightest: String(k.lightest) }];
        }),
      ) as Record<KitKind, { step: string; lightest: string }>,
  );
  const [saved, setSaved] = useState(false);
  const overrides = Object.keys(profile.stepOverrides ?? {}).length;
  const valid = KIT_KINDS.every(
    ({ kind }) => (num(values[kind].step) ?? 0) > 0 && num(values[kind].lightest) !== null,
  );

  return (
    <>
      <TopBar back={{ href: '/settings' }} title="Weight steps" />
      <main className={s['body']} style={{ gap: 20 }}>
        <p className={s['lede']}>
          The smallest jumps at your gym. Tare rounds every weight it suggests to these.
        </p>
        {saved ? <Banner tone="success" title="Saved" /> : null}
        {KIT_KINDS.map(({ kind, label, hint }) => (
          <div key={kind} className={s['stack']}>
            <SectionLabel as="h2">{label}</SectionLabel>
            <p className={s['lede']} style={{ fontSize: 14 }}>
              {hint}
            </p>
            <div className={s['grid2']}>
              <TextField
                label="Smallest jump · kg"
                inputMode="decimal"
                value={values[kind].step}
                onChange={(v) => setValues({ ...values, [kind]: { ...values[kind], step: v } })}
              />
              <TextField
                label="Lightest · kg"
                inputMode="decimal"
                value={values[kind].lightest}
                onChange={(v) => setValues({ ...values, [kind]: { ...values[kind], lightest: v } })}
              />
            </div>
          </div>
        ))}
        {overrides ? (
          <div className={s['row']} style={{ justifyContent: 'space-between' }}>
            <span className={s['lede']}>
              {overrides} exercise{overrides === 1 ? ' has its' : 's have their'} own jump
            </span>
            <Button
              variant="secondary-outline"
              size={52}
              onClick={() => void r.profile.update({ stepOverrides: {} })}
            >
              Reset
            </Button>
          </div>
        ) : null}
        <div className={s['foot']}>
          <Button
            size={60}
            fullWidth
            disabled={!valid}
            onClick={() =>
              void r.profile
                .update({
                  kitLoads: Object.fromEntries(
                    KIT_KINDS.map(({ kind }) => [
                      kind,
                      {
                        step: num(values[kind].step) ?? 1,
                        lightest: num(values[kind].lightest) ?? 0,
                      },
                    ]),
                  ),
                })
                .then(() => setSaved(true))
            }
          >
            Save
          </Button>
        </div>
      </main>
    </>
  );
}

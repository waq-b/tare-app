// Settings → About you: the body stats behind suggested starting weights
// (tr.global.starting_load). A new weight here is also saved as a weigh-in.
import { Banner, Button, SectionLabel, SegmentedControl, TextField, TopBar } from '@tare/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useAppData } from '../data/DbContext.tsx';
import type { Profile } from '../db/index.ts';
import { saveBody } from '../settings/body.ts';
import s from './screens.module.css';

const SEXES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Rather not say' },
] as const;
type Sex = (typeof SEXES)[number]['value'];

export function AboutYou() {
  const { r } = useAppData();
  const loaded = useLiveQuery(
    async () => ({
      profile: (await r.profile.get()) ?? null,
      weight: (await r.weighIns.list()).at(-1)?.kg ?? null,
    }),
    [r],
  );
  if (!loaded) return <main aria-busy="true" aria-label="Loading" />;
  if (!loaded.profile) return null;
  return <Form profile={loaded.profile} weight={loaded.weight} />;
}

function Form({ profile, weight }: { profile: Profile; weight: number | null }) {
  const data = useAppData();
  const [sex, setSex] = useState<Sex | null>(profile.sex ?? null);
  const [age, setAge] = useState(
    profile.birthYear ? String(new Date().getFullYear() - profile.birthYear) : '',
  );
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [kg, setKg] = useState(weight ? String(weight) : '');
  const [saved, setSaved] = useState(false);

  return (
    <>
      <TopBar back={{ href: '/settings' }} title="About you" />
      <main className={s['body']} style={{ gap: 20 }}>
        <p className={s['lede']}>
          Used to suggest starting weights for exercises you haven’t logged yet. Estimates aim low
          and you can change any of them.
        </p>
        {saved ? <Banner tone="success" title="Saved" /> : null}
        <div className={s['stack']}>
          <SectionLabel as="h2">Sex</SectionLabel>
          <SegmentedControl
            label="Sex"
            tone="neutral"
            value={sex}
            onChange={setSex}
            options={SEXES}
          />
        </div>
        <div className={s['grid2']}>
          <TextField
            label="Age"
            inputMode="numeric"
            value={age}
            onChange={(v) => setAge(v.replace(/\D/g, ''))}
          />
          <TextField
            label="Weight · kg"
            inputMode="decimal"
            value={kg}
            onChange={(v) => setKg(v.replace(/[^\d.,]/g, ''))}
          />
        </div>
        <TextField
          label="Height · cm · optional"
          inputMode="numeric"
          value={height}
          onChange={(v) => setHeight(v.replace(/\D/g, ''))}
        />
        <div className={s['foot']}>
          <Button
            size={60}
            fullWidth
            onClick={() =>
              void saveBody(data, { sex, age, heightCm: height, bodyweight: kg }, weight).then(() =>
                setSaved(true),
              )
            }
          >
            Save
          </Button>
        </div>
      </main>
    </>
  );
}

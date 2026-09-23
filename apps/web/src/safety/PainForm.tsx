// The pain-flag questions (the D1 sheet, decision #44). The engine routes the answers to a
// safety rule (routePainFlag); the questions are our wording of each rule's red flag.
import { vpt } from '@tare/data';
import { routePainFlag, SIGNS, TIMINGS, type PainSign, type PainTiming } from '@tare/engine';
import {
  Button,
  Checkbox,
  ChoiceChip,
  EmergencyShortcut,
  RadioCard,
  SectionLabel,
  SegmentedControl,
} from '@tare/ui';
import { useState, type ReactNode } from 'react';
import s from '../screens/screens.module.css';

export type Side = 'left' | 'right' | 'both';
export interface PainResult {
  ruleId: string;
  area: string | null;
  side: Side | null;
}

export const humanArea = (t: string) => (t.charAt(0).toUpperCase() + t.slice(1)).replace(/_/g, ' ');

/** The form's body and its Continue button (a sheet puts the button in its footer). */
export function usePainForm(onResult: (r: PainResult) => void, busy = false) {
  const [area, setArea] = useState<string | null>(null);
  const [side, setSide] = useState<Side>('right');
  const [timing, setTiming] = useState<PainTiming | null>(null);
  const [signs, setSigns] = useState<PainSign[]>([]);
  const [unsure, setUnsure] = useState(false);
  const sided = vpt().enums.body_area_sided;
  const routed = routePainFlag({ area, timing, signs, unsure });
  const sideOf = (a: string | null) => (a && sided.includes(a) ? side : null);

  const body: ReactNode = (
    <>
      <EmergencyShortcut
        label="Chest pain, or struggling to breathe?"
        onClick={() => onResult({ ruleId: 'chest_pain_emergency', area: null, side: null })}
      />
      <div className={s['stack']}>
        <SectionLabel as="h3">Where?</SectionLabel>
        <div role="group" aria-label="Where does it hurt?" className={s['chips']}>
          {vpt().enums.body_areas.map((a) => (
            <ChoiceChip
              key={a}
              selected={area === a}
              onToggle={() => setArea(area === a ? null : a)}
            >
              {humanArea(a)}
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
            onChange={(c) =>
              setSigns((cur) => (c ? [...cur, x.sign] : cur.filter((y) => y !== x.sign)))
            }
          />
        ))}
        <Checkbox label="I’m not sure if it’s serious" checked={unsure} onChange={setUnsure} />
      </div>
    </>
  );

  const footer: ReactNode = (
    <Button
      size={60}
      fullWidth
      disabled={!routed || busy}
      onClick={() => routed && onResult({ ruleId: routed, area, side: sideOf(area) })}
    >
      Continue
    </Button>
  );
  return { body, footer };
}

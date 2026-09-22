import { Icon } from '@tare/icons';
import { Button } from '../Button/Button';
import { ChoiceChip } from '../ChoiceChip/ChoiceChip';
import { DiffChip } from '../DiffChip/DiffChip';
import { RuleCitation, type CitedRule } from '../RuleCitation/RuleCitation';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import { Tag } from '../Tag/Tag';
import styles from './ChangeCard.module.css';

export type ChangeKind = 'progress' | 'hold' | 'volume';
export type DecisionState = 'pending' | 'accepted' | 'kept';

const KIND: Record<ChangeKind, { label: string; tone: 'progress' | 'hold' | 'swap' }> = {
  progress: { label: 'Progress', tone: 'progress' },
  hold: { label: 'Hold', tone: 'hold' },
  volume: { label: 'Volume', tone: 'swap' },
};

export interface ReasonOption {
  value: string;
  label: string;
}

/** "Keep as is" + "Accept": the user's decision on one proposed change. */
export function AcceptReject({
  onAccept,
  onKeep,
  subject,
}: {
  onAccept?: () => void;
  onKeep?: () => void;
  subject: string;
}) {
  return (
    <div className={styles['decide']}>
      <Button
        variant="secondary-outline"
        size={52}
        icon={<Icon name="close" size={18} />}
        onClick={onKeep}
      >
        Keep as is<span className="sr-only">: {subject}</span>
      </Button>
      <Button size={52} icon={<Icon name="check" size={18} />} onClick={onAccept}>
        Accept<span className="sr-only">: {subject}</span>
      </Button>
    </div>
  );
}

/** What happened to a change, with Undo. */
export function DecisionStatus({
  state,
  reason,
  onUndo,
}: {
  state: 'accepted' | 'kept';
  reason?: string;
  onUndo?: () => void;
}) {
  return (
    <div className={state === 'accepted' ? styles['accepted'] : styles['kept']} role="status">
      <Icon name={state === 'accepted' ? 'check' : 'close'} size={18} />
      <span>
        {state === 'accepted' ? 'Accepted: in your next session' : 'Kept as is'}
        {reason ? ` · ${reason}` : ''}
      </span>
      <button type="button" className={styles['undo']} onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}

/** "Why? (optional)" after keeping a change. The answer feeds the next review. */
export function ReasonPicker({
  options,
  value,
  onChange,
}: {
  options: readonly ReasonOption[];
  value: string | null;
  onChange?: (v: string) => void;
}) {
  return (
    <div className={styles['reasons']}>
      <SectionLabel as="div">Why? (optional)</SectionLabel>
      <div role="group" aria-label="Why keep it as is?" className={styles['reasonRow']}>
        {options.map((o) => (
          <ChoiceChip
            key={o.value}
            variant="filled"
            tone="accent"
            selected={value === o.value}
            onToggle={() => onChange?.(o.value)}
          >
            {o.label}
          </ChoiceChip>
        ))}
      </div>
    </div>
  );
}

export interface ChangeCardProps {
  kind: ChangeKind;
  exercise: string;
  from: string;
  to: string;
  /** Plain-language reason from the AI proposal (already checked by the validator). */
  rationale: string;
  /** Rules the change cites, resolved from rule_ids.json. */
  rules: readonly CitedRule[];
  state: DecisionState;
  reasonOptions?: readonly ReasonOption[];
  keepReason?: string | null;
  onAccept?: () => void;
  onKeep?: () => void;
  onUndo?: () => void;
  onReason?: (reason: string) => void;
}

/** One proposed change in the weekly review. Nothing changes until the user accepts. */
export function ChangeCard(p: ChangeCardProps) {
  const kind = KIND[p.kind];
  const reasonLabel = p.reasonOptions?.find((o) => o.value === p.keepReason)?.label;
  return (
    <article className={styles['card']} aria-label={`${kind.label}: ${p.exercise}`}>
      <div className={styles['head']}>
        <Tag tone={kind.tone}>{kind.label}</Tag>
        <h3 className={styles['exercise']}>{p.exercise}</h3>
      </div>
      <div>
        <DiffChip from={p.from} to={p.to} tone={kind.tone} />
      </div>
      <p className={styles['rationale']}>{p.rationale}</p>
      <div className={styles['why']}>
        {p.rules.map((r) => (
          <RuleCitation key={r.id} rule={r} />
        ))}
      </div>
      {p.state === 'pending' ? (
        <AcceptReject
          subject={p.exercise}
          {...(p.onAccept ? { onAccept: p.onAccept } : {})}
          {...(p.onKeep ? { onKeep: p.onKeep } : {})}
        />
      ) : (
        <DecisionStatus
          state={p.state}
          {...(reasonLabel ? { reason: reasonLabel } : {})}
          {...(p.onUndo ? { onUndo: p.onUndo } : {})}
        />
      )}
      {p.state === 'kept' && p.reasonOptions ? (
        <ReasonPicker
          options={p.reasonOptions}
          value={p.keepReason ?? null}
          {...(p.onReason ? { onChange: p.onReason } : {})}
        />
      ) : null}
    </article>
  );
}

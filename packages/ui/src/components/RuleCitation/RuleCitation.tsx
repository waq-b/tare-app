import { Icon } from '@tare/icons';
import { EvidenceBadge } from '../EvidenceBadge/EvidenceBadge';
import { SourceLink, type SourceData } from '../SourceLink/SourceLink';
import { Tag } from '../Tag/Tag';
import styles from './RuleCitation.module.css';

/** What the "why" UI needs from a rule (matches @tare/data's RuleEntry). */
export interface CitedRule {
  id: string;
  label: string;
  evidenceStrength: string | undefined;
  sources: readonly SourceData[];
  /** Raw rule, to spot `engine_default` (our synthesis, labelled as such). */
  raw?: Readonly<Record<string, unknown>>;
}

/** The real rule ID, e.g. "pr.double_progression". */
export function RuleChip({ rule }: { rule: Pick<CitedRule, 'id' | 'label'> }) {
  return (
    <span className={styles['chip']} title={rule.label}>
      <Icon name="book" size={14} />
      <span className="sr-only">Rule </span>
      {rule.id}
    </span>
  );
}

const isEngineDefault = (raw: CitedRule['raw']) => {
  const v = raw?.['engine_default'];
  return v === true || (Array.isArray(v) && v.length > 0);
};

/** Rule ID, evidence strength and first source: the "why" behind any change. */
export function RuleCitation({ rule }: { rule: CitedRule }) {
  const [first, ...rest] = rule.sources;
  return (
    <div className={styles['cite']}>
      <div className={styles['row']}>
        <RuleChip rule={rule} />
        <EvidenceBadge strength={rule.evidenceStrength} />
        {isEngineDefault(rule.raw) ? <Tag>Tare default</Tag> : null}
      </div>
      {first ? <SourceLink source={first} more={rest.length} /> : null}
    </div>
  );
}

// Fixture domain types. Fictional data for stories only; P0 defines the app's real models.

export type ISODate = string; // YYYY-MM-DD

export type SetEffort = 'easy' | 'ok' | 'hard';
export type SessionFeel = 'easy' | 'good' | 'tough' | 'wrecked';
export type Side = 'left' | 'right' | 'both';

export interface Profile {
  name: string;
  goalId: string; // tr.goal.*
  goalsRanked: string[]; // goal keys, first = main
  level: 'beginner' | 'intermediate';
  daysPerWeek: number;
  sessionMinutes: number;
  units: 'kg' | 'lb';
  dumbbellConvention: 'per_hand' | 'total';
  kit: string[]; // enums.equipment_detail
  cantDo: string[]; // enums.skill_tags
  region: 'england' | 'wales' | 'scotland' | 'northern_ireland';
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  repRange: [number, number];
  /** Working load at the start of the fixture period (kg; per hand for dumbbells). */
  startLoad: number;
}

export interface PlannedSession {
  id: 'A' | 'B' | 'C';
  name: string;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
  exercises: PlannedExercise[];
}

export interface LoggedSet {
  kind: 'warmup' | 'work';
  load: number;
  reps: number;
  effort?: SetEffort;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: LoggedSet[];
}

export interface LoggedSession {
  id: string;
  date: ISODate;
  week: number;
  sessionId: PlannedSession['id'];
  deload: boolean;
  durationMin: number;
  feel: SessionFeel;
  exercises: LoggedExercise[];
  synced: boolean;
}

export interface WeighIn {
  date: ISODate;
  time: string;
  kg: number;
  waistCm?: number;
}

export type ChangeKind = 'progress' | 'hold' | 'volume';
export type DecisionState = 'pending' | 'accepted' | 'kept';
export type KeepReason = 'too_heavy' | 'dont_like' | 'no_kit';

export interface ProposedChange {
  id: string;
  kind: ChangeKind;
  exerciseId: string;
  from: string;
  to: string;
  /** Plain-language reason written by the AI (fixture text). */
  rationale: string;
  /** Real rule IDs the change cites; validated against rule_ids.json in tests. */
  ruleIds: string[];
  state: DecisionState;
  keepReason?: KeepReason;
}

export interface WeeklyReview {
  week: number;
  weekStart: ISODate;
  weekEnd: ISODate;
  sessionsDone: number;
  sessionsPlanned: number;
  summary: string;
  writtenAt: string; // ISO datetime
  changes: ProposedChange[];
}

export interface PainFlag {
  id: string;
  date: ISODate;
  area: string; // enums.body_areas
  side: Side;
  ruleId: string; // safety_rules.json rule
  exerciseId?: string;
  status: 'active' | 'cleared';
  clearedOn?: ISODate;
}

export interface NotificationItemData {
  id: string;
  category: 'safety' | 'plan' | 'coach' | 'sync' | 'deload';
  title: string;
  body: string;
  at: string; // ISO datetime
  read: boolean;
  response?: 'better_same_worse' | 'open_review';
}

// IndexedDB via Dexie: the source of truth on the phone (hard line 4).
import { Dexie, type EntityTable } from 'dexie';
import type { MetaEntry, OutboxEntry, RecordOf } from './model.ts';

export class TareDb extends Dexie {
  profile!: EntityTable<RecordOf['profile'], 'id'>;
  screening!: EntityTable<RecordOf['screening'], 'id'>;
  plans!: EntityTable<RecordOf['plans'], 'id'>;
  workouts!: EntityTable<RecordOf['workouts'], 'id'>;
  sets!: EntityTable<RecordOf['sets'], 'id'>;
  weighIns!: EntityTable<RecordOf['weighIns'], 'id'>;
  painFlags!: EntityTable<RecordOf['painFlags'], 'id'>;
  changes!: EntityTable<RecordOf['changes'], 'id'>;
  outbox!: EntityTable<OutboxEntry, 'seq'>;
  meta!: EntityTable<MetaEntry, 'key'>;

  constructor(name = 'tare') {
    super(name);
    // Only indexed fields are listed. Add a new version() for any change; never edit this one.
    this.version(1).stores({
      profile: 'id',
      screening: 'id, takenAt',
      plans: 'id, active',
      workouts: 'id, date, startedAt, finishedAt',
      sets: 'id, workoutId, exerciseId, [exerciseId+loggedAt]',
      weighIns: 'id, date',
      painFlags: 'id, status, date',
      outbox: '++seq, [table+id]',
      meta: 'key',
    });
    // P1: the rules' changes (applied, offered, accepted, kept).
    this.version(2).stores({
      changes: 'id, date, kind, status, exerciseId',
    });
  }
}

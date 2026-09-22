// The weekly plan: three sessions from real staples, within tr.goal.fat_loss ranges.
import type { PlannedSession } from './types';

export const plan: PlannedSession[] = [
  {
    id: 'B',
    name: 'Session B · Push + pull',
    weekday: 1, // Tuesday
    exercises: [
      {
        exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
        sets: 3,
        repRange: [6, 10],
        startLoad: 60,
      },
      { exerciseId: 'Wide-Grip_Lat_Pulldown', sets: 3, repRange: [8, 12], startLoad: 45 },
      { exerciseId: 'Incline_Dumbbell_Press', sets: 3, repRange: [8, 12], startLoad: 16 },
      { exerciseId: 'Seated_Cable_Rows', sets: 3, repRange: [8, 12], startLoad: 45 },
      { exerciseId: 'Side_Lateral_Raise', sets: 2, repRange: [10, 15], startLoad: 6 },
      { exerciseId: 'Triceps_Pushdown', sets: 2, repRange: [10, 15], startLoad: 20 },
    ],
  },
  {
    id: 'C',
    name: 'Session C · Hinge + press',
    weekday: 3, // Thursday
    exercises: [
      { exerciseId: 'Barbell_Deadlift', sets: 3, repRange: [6, 8], startLoad: 90 },
      { exerciseId: 'Standing_Military_Press', sets: 3, repRange: [6, 10], startLoad: 35 },
      { exerciseId: 'Dumbbell_Lunges', sets: 3, repRange: [8, 12], startLoad: 12 },
      { exerciseId: 'Standing_Calf_Raises', sets: 2, repRange: [10, 15], startLoad: 40 },
      { exerciseId: 'Hammer_Curls', sets: 2, repRange: [10, 15], startLoad: 10 },
    ],
  },
  {
    id: 'A',
    name: 'Session A · Squat + pull',
    weekday: 5, // Saturday
    exercises: [
      { exerciseId: 'Barbell_Squat', sets: 3, repRange: [6, 10], startLoad: 70 },
      { exerciseId: 'Wide-Grip_Lat_Pulldown', sets: 3, repRange: [8, 12], startLoad: 45 },
      { exerciseId: 'Leg_Press', sets: 3, repRange: [10, 15], startLoad: 100 },
      { exerciseId: 'Dumbbell_Incline_Row', sets: 3, repRange: [8, 12], startLoad: 18 },
      { exerciseId: 'Dumbbell_Bicep_Curl', sets: 2, repRange: [10, 15], startLoad: 10 },
    ],
  },
];

export function plannedSession(id: PlannedSession['id']): PlannedSession {
  const s = plan.find((x) => x.id === id);
  if (!s) throw new Error(`fixtures: no session ${id}`);
  return s;
}

/** Exercises that stall in the fixture (for pr.stall stories): lat pulldown from week 6. */
export const STALLED = { exerciseId: 'Wide-Grip_Lat_Pulldown', fromWeek: 6 };

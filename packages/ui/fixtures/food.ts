// FIXTURE ONLY. vpt has no food targets yet (data-issues #18, GitHub #20), so these numbers are
// invented for the P4 Food stories. Never use them in the app.
export const FIXTURE_FOOD_TARGETS = { energyKcal: 2200, proteinG: 160 } as const;

export const FIXTURE_MEALS_TODAY = [
  { name: 'Breakfast', items: 'Porridge, banana, coffee', kcal: 420, proteinG: 18 },
  { name: 'Lunch', items: 'Chicken wrap, yoghurt', kcal: 610, proteinG: 48 },
  { name: 'Snack', items: 'Protein shake', kcal: 280, proteinG: 42 },
  { name: 'Dinner', items: null, kcal: null, proteinG: null },
] as const;

export const FIXTURE_MACROS_TODAY = { proteinG: 108, carbsG: 118, fatG: 42 } as const;

export const FIXTURE_FOOD_WEEK = [
  { date: '2026-09-14', kcal: 2150, proteinG: 162, dayType: 'rest' },
  { date: '2026-09-15', kcal: 2280, proteinG: 158, dayType: 'gym' },
  { date: '2026-09-16', kcal: 2090, proteinG: 149, dayType: 'rest' },
  { date: '2026-09-17', kcal: 2310, proteinG: 166, dayType: 'gym' },
  { date: '2026-09-18', kcal: 2240, proteinG: 151, dayType: 'rest' },
  { date: '2026-09-19', kcal: 2150, proteinG: 155, dayType: 'gym' },
  { date: '2026-09-20', kcal: null, proteinG: null, dayType: 'rest' },
] as const;

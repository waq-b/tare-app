# Virtual PT: P1 dataset (v0.1.1)

Evidence-based data for the workout app's rules engine and weekly AI call. It covers training, progression, safety and the exercise library. Cardio, nutrition and fasting are out of scope for now.

## Files

| File | What |
|---|---|
| `data/exercises.json` | 876 exercises plus an `enums` block. 111 `staple`s have hand-picked swaps and cues |
| `data/training_rules.json` | Per-goal parameters (`tr.goal.*`), global rules, minimum/maintenance doses, source conflicts |
| `data/progression_rules.json` | Progression methods, volume progression, stall steps, deload, new-user ramp (`pr.*`) |
| `data/safety_rules.json` | 20 red-flag rules and onboarding screening (`sf.screening`) |
| `data/rule_ids.json` | Every rule ID (56), for validating AI citations |
| `data/sources.json` | Source registry, with a `verification` level per source |
| `build_exercises.py`, `build_rules.py`, `staples.py` | Rebuild everything. `staples.py` holds the hand-curated swaps and cues. `raw/` holds the upstream dataset |

## Rule IDs

Every rule has a permanent `id`. IDs never change and are never reused. A retired rule keeps its ID and gets `retired: true`.

| Prefix | File | Examples |
|---|---|---|
| `tr.` | training_rules | `tr.goal.hypertrophy`, `tr.global.min_frequency`, `tr.dose.maintenance_younger`, `tr.conflict.rest` |
| `pr.` | progression_rules | `pr.double_progression`, `pr.two_for_two`, `pr.stall`, `pr.stall.step2`, `pr.deload`, `pr.volume_progression`, `pr.new_user_ramp` |
| bare | safety red flags | `chest_pain_emergency`, `doms_normal` (unchanged from v0.1.0) |
| `sf.` | screening | `sf.screening`, cited as `sf.screening.symptoms` etc. The question IDs inside the file stay bare, because the matrix keys use them |

AI suggestions should cite IDs, e.g. "changed because pr.stall.step2". Check the citation against `rule_ids.json`.

## Exercise enums

These are also published inside `exercises.json` → `enums`, and the build asserts every exercise uses only these values.

- **muscles (17):** abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps
- **equipment (12):** barbell, dumbbell, kettlebell, ez_bar, cable, machine, bands, bodyweight, medicine_ball, exercise_ball, foam_roller, other. `none` has been merged into `bodyweight`.
- **movement_pattern:** squat, hinge, lunge, push_h, push_v, pull_h, pull_v, carry, core, isolation, cardio, plyometric, olympic, mobility
- **level:** beginner, intermediate, advanced
- **swap reason:** same_pattern_diff_kit, easier_regression, harder_progression, same_muscle
- **increment_class:** `upper` or `lower`. Maps to the increments in `pr.*`. Lower means squat, hinge or lunge patterns, or leg muscles as primary.
- **load_convention:**

  | Value | Meaning |
  |---|---|
  | `total` | Whole load: barbell with plates, stack weight, or a single implement (e.g. goblet squat, one kettlebell) |
  | `per_hand` | Weight of each dumbbell/kettlebell when one is held in each hand; for one-arm moves, the weight in that hand |
  | `per_side` | Plates on one side (plate-loaded "Leverage" machines) |
  | `bodyweight` | No external load (also used for cardio and mobility) |
  | `bodyweight_plus` | Bodyweight plus added load (weighted pull-ups/dips) |
  | `assisted` | Band or machine assistance |

  Band exercises are marked `total`, but bands have no meaningful kg value. The app should log band level for these.

## Swaps

- `swaps` is an ordered array of `{ id, reason }`, best swap first.
- **Staples (111):** swaps are hand-picked and checked (`derived.swaps: false`). Heavy barbell compounds list loaded alternatives first; bodyweight and band options come last, and are mostly tagged `easier_regression`.
- **Everything else:** swaps are ranked by staple status, then same primary muscle, same equipment class and level, then how close the load is. Heavy barbell compounds are penalised for bodyweight or band swaps. Reasons are derived from level and equipment. Treat them as good defaults, not gospel.
- **No-swap count:** v0.1.0's README said 23; it was really 146, 123 of them mobility. It is now **0**. Mobility moves swap to other mobility moves for the same muscle. Exercises with no same-pattern match fall back to same-muscle swaps.

## Cues

The 111 staples have 2–4 short cues each, in our own wording. **The other 765 exercises have empty `cues`**, though every exercise still has the upstream `instructions`.

## Key evidence calls

- **ACSM 2026** is the anchor. It says:
  - train each muscle ≥2×/week
  - ≥10 sets per muscle per week for growth
  - loads from 30% to 100% of 1RM all build muscle when sets end 2–3 reps short of failure
  - rest and periodisation matter less than once thought
- **Weekly volume** uses fractional set counting: a set counts 0.5 for a secondary muscle (Pelland 2026).
- **Deloads** are expert consensus only. One RCT found a mid-programme deload gave similar muscle growth but *less* lower-body strength gain. Present deloads as fatigue management, not as extra gains.
- **Fat loss** has no special rep scheme. Lifting keeps muscle; diet drives fat loss.

## Verification

`sources.json` marks each source as `full_text` (21), `abstract_only` (2) or `secondary_only` (8).

In v0.1.1 these were re-checked against the primary source:

- **Confirmed:** Helms RPE/RIR scale, Grgic rest intervals, and all three ACSM 2009 figures.
- **Corrected:** Coleman deload result, Spiering maintenance doses (age bands and size-only note), and the NSCA load increments.
- **Still flagged:** NSCA textbook values (secondary sources only), plus Schoenfeld 2017, Robinson 2024, Refalo 2024, Androulakis-Korakakis 2020, Bell 2024, IOC REDs and Riebe 2015 (all `secondary_only`). None of them drives a hard number the engine depends on. See CHANGELOG.

## Licence and legal

- **Exercise text:** Unlicense via free-exercise-db. Cues are our own wording.
- **Images:** excluded, because their provenance is unclear.
- **PAR-Q+:** must not be reproduced without written consent. The screening questions here are our own, based on the ACSM criteria.
- **Rules files:** cited figures, our own wording.
- **Not medical advice.** Say so once, at onboarding.

## Known limits

- Movement patterns for non-staples come from keyword heuristics, so the long tail can be misfiled (e.g. some shoulder complexes sit under `isolation`).
- Cleveland Clinic (US) is the source for the DOMS thresholds and the illness "neck check". Both are labelled as such.

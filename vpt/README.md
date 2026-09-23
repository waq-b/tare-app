# Virtual PT: P1 dataset (v0.1.3)

Evidence-based data for the workout app's rules engine and weekly AI call. It covers training, progression, safety and the exercise library. Cardio, nutrition and fasting are out of scope for now.

## Files

| File | What |
|---|---|
| `data/exercises.json` | 876 exercises, plus `enums`, `muscle_groups` and `body_area_map`. The 111 `staple`s have hand-picked swaps, cues, display names, body areas, kit detail and skill tags |
| `data/training_rules.json` | Per-goal parameters (`tr.goal.*`), global rules, minimum/maintenance doses, source conflicts |
| `data/progression_rules.json` | Progression methods, volume progression, stall steps, deload, new-user ramp (`pr.*`) |
| `data/safety_rules.json` | 21 red-flag rules, UK `services` contacts, and onboarding screening (`sf.screening`), including the `cleared_by_gp` path |
| `data/rule_ids.json` | Every rule ID (67), for validating AI citations |
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
- **body_areas (10):** neck, shoulder, elbow, wrist, upper_back, lower_back, hip, knee, ankle, calf. Sided areas (`body_area_sided`) are shoulder, elbow, wrist, hip, knee, ankle and calf. Side values: left, right, both.
- **equipment_detail (49):** fine-grained kit, e.g. flat_bench, adjustable_bench, power_rack, smith_machine, leg_press, lat_pulldown, cable_stack, rope_attachment, dip_station and pull_up_bar. The full list is in `enums.equipment_detail`. The coarse `equipment` field is unchanged. Max dumbbell weight is a user setting, not an exercise tag.
- **skill_tags (13):** pull_up, chin_up, dip, push_up, pistol_squat, box_jump, jump, muscle_up, handstand, dead_hang, ab_rollout, olympic_lift, nordic_curl. For "can't do yet" filtering.
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

## New exercise fields (v0.1.2)

| Field | What | Coverage |
|---|---|---|
| `display_name` | Short gym name ("Bench press", "RDL", "OHP") | Staples only. `null` elsewhere, so fall back to `name` |
| `aliases` | Other common names | Staples. Empty elsewhere |
| `body_areas` | `[{area, load}]`, where load is `primary` (takes real load) or `secondary` (grip, stabilising, involved) | All exercises. Hand-checked on staples; heuristic elsewhere (`derived.body_areas`) |
| `equipment_detail` | Specific kit needed. **All** tags are required | All. Hand-checked on staples |
| `skill_tags` | Skills needed before the move is possible | All. Hand-checked on staples |
| `stabilisers` | Muscles that hold position but aren't counted in volume | Trimmed on 38 staples (`derived.muscles: false`); empty elsewhere |

**`body_area_map`** (top level) maps each area to `{primary: [ids], secondary: [ids]}`. After a pain flag, exclude exercises where the area is `primary`. Exclusion is side-agnostic. Mobility moves are only ever `secondary`.

**`muscle_groups`** (top level) is a display roll-up: chest, back, shoulders, arms, core, quads, hamstrings, glutes, calves, hips, neck. Every muscle sits in exactly one group. **Counting:**
- Each set credits a group with the **max** of its member muscles' credit, not the sum.
- Targets stay per muscle; group totals are display only.
- The full rule is `tr.global.muscle_group_rollup`.

## Swaps

- `swaps` is an ordered array of `{ id, reason }`, best swap first.
- **Staples (111):** swaps are hand-picked and checked (`derived.swaps: false`). Heavy barbell compounds list loaded alternatives first; bodyweight and band options come last, and are mostly tagged `easier_regression`.
- **Everything else:** swaps are ranked by staple status, then same primary muscle, same equipment class and level, then how close the load is. Heavy barbell compounds are penalised for bodyweight or band swaps. Reasons are derived from level and equipment. Treat them as good defaults, not gospel.
- **No-swap count:** v0.1.0's README said 23; it was really 146, 123 of them mobility. It is now **0**. Mobility moves swap to other mobility moves for the same muscle. Exercises with no same-pattern match fall back to same-muscle swaps.

## Cues

The 111 staples have 2–4 short cues each, in our own wording. **The other 765 exercises have empty `cues`**, though every exercise still has the upstream `instructions`.

## New rules (v0.1.3)

| ID | What | Evidence |
|---|---|---|
| `tr.global.starting_load` | A conservative first working load from sex, age, bodyweight, height (optional) and level. See the formula below. 24 loaded staples have an estimate; the other 56 loaded staples, and all bodyweight moves, calibrate from an Easy first set | weak, engine_default |
| `pr.personal_adjustment` | Bounds for adapting suggestions to how the user lifts: at most ±10% in total and 5% a week, after 4+ sessions and a consistent gap of 5% or more. Lifting lighter while logging Easy never lowers a suggestion. Never past goal ranges, increment ranges, screening caps, pain flags or safety rules | weak, engine_default |

**Starting load formula:**

```
reference_mass = min(bodyweight, 25 × height_m²)      (bodyweight if no height)
estimated_1RM  = reference_mass × ratio_1rm[sex][level][anchor] × age_factor(age) × staple_factor
working_load   = estimated_1RM × min(1 / (1 + (target_reps + 4) / 30), cap) × 0.9  → round DOWN to the kit step
```

- **Anchors:** squat, bench, deadlift, OHP, lat pulldown, row.
- **Sex:** "prefer not to say" uses the female ratios.
- **Caps:** 0.60 for beginners, 0.70 for intermediates and 0.50 from age 65.
- **Age factor:** 1.0 up to 40, 0.90 at 50, 0.75 at 60 and 0.45 at 75. Over 75, calibrate instead.
- **Below the lightest option** (e.g. the empty bar): use the lightest option only if it's ≤70% of the estimated 1RM. Otherwise suggest lighter kit or calibrate.
- **Worked examples:** pinned by build asserts, in `value.worked_examples`. For example, a 35-year-old beginner man, 92 kg and 180 cm, doing 10 reps gets a 40 kg squat, 30 kg bench, 47.5 kg deadlift, an empty-bar OHP and 12 kg dumbbells for DB bench.
- **Evidence:** the ratios lean on crowd-sourced standards (low evidence), checked against Cooper bench norms and the baselines of untrained people in trials. Say so in the "why" UI.

## Rules added in v0.1.2

| ID | What | Evidence |
|---|---|---|
| `tr.global.effort_set_map` | Set effort maps to RPE: Easy is ≤6, OK is 7–8, Hard is 9–10. Also says how progression triggers read it | weak, engine_default |
| `tr.global.effort_session_map` | Session feel maps to sRPE: Easy 1–3, Good 4–6, Tough 7–8, Wrecked 9–10. **A hard session means Tough or Wrecked** | moderate, engine_default |
| `tr.global.warm_up` | Ramp of 50%×5, 75%×3, then 90%×1 (only if working reps are ≤6). Excluded from progression, e1RM and volume | weak, engine_default |
| `tr.global.e1rm` | Epley formula, **only from sets of ≤10 reps**, labelled "estimated" | moderate, engine_default |
| `tr.global.swap_starting_load` | Ratio, then ×0.9, then round down. Barbell→DB is 0.41 per hand. Where there's no ratio, calibrate from an Easy first set | weak, engine_default |
| `tr.global.muscle_group_rollup` | Group credit is the max of member credits, not the sum. Targets stay per muscle | weak, engine_default |
| `tr.global.push_pull_balance` | A **nudge only**, not a ratio. No position stand gives a push:pull ratio | weak, engine_default |
| `pain_during_exercise` | Mid-session pain → `modify_exercise`: stop that exercise, skip moves where the area is primary, and escalate if it persists | moderate |
| `sf.screening.cleared_by_gp` | "Spoken to your GP?" Yes unlocks setup at light-to-moderate intensity. No saves progress, so it's not a dead end | strong (ACSM logic) |

`pr.volume_progression` has gained `requires_structured`, and `pr.deload.triggers` has gained `autoregulated_structured`. Both now define "hard" via `tr.global.effort_session_map`.

## Safety services

`safety_rules.json → services` lists:
- 999
- NHS 111, with online links for England, Wales and Scotland (NHS 24). Northern Ireland has no 111, so it points to GP out of hours instead.
- GP finder
- NHS MSK/physio self-referral
- CSP private physio finder

Every rule has a `services` list of keys to offer. The app owns the label per action, and `user_message` is shown verbatim.

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

`sources.json` marks each source as `full_text` (47), `abstract_only` (14) or `secondary_only` (13). v0.1.2 added 22 sources; v0.1.3 added 21.

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

- Movement patterns for non-staples come from keyword heuristics, so the long tail can be misfiled (e.g. some shoulder complexes sit under `isolation`). v0.1.2 fixed a matching bug that sent 19 machine/Smith exercises to `pull_v`.
- Non-staples keep the upstream secondaries, which can be bloated (e.g. `Deficit_Deadlift`). Only the staples were trimmed.
- Cleveland Clinic (US) is the source for the DOMS thresholds and the illness "neck check". Both are labelled as such.

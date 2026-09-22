# Changelog

## v0.1.2 (2026-09-22)

Requests from the app build (Tare). All changes are additive: no IDs, fields or enum values were removed or renamed. Numbers below refer to `docs/data-issues.md`.

### Fixed
- **#1 Pattern bug.** Keyword matching now uses word boundaries. Before, "ma**chin**e" matched the chin-up keyword, which sent 19 machine and Smith exercises to `pull_v`. That included the staples `Machine_Bench_Press`, `Smith_Machine_Bench_Press` and `Machine_Shoulder_Military_Press`.
  - I also checked all 111 staples by hand. That fixed `Air_Bike` (was core, now cardio) and `Front_Squat_Clean_Grip` (was olympic, now squat).
  - `Reverse_Machine_Flyes` is now `pull_h`.
- **#2 load_convention.** `per_side` is confirmed for all 8 plate-loaded `Leverage_*` machines. It means plates on one side, so the UI should show "per side", not "2 ×".
  - Staples moved to `bodyweight`: `Dips_-_Chest_Version`, `Ab_Roller`, `Hyperextensions_Back_Extensions` and `Glute_Ham_Raise` (all were `total`).
- **#3 Secondaries.** Trimmed on 38 staples. Muscles that only grip or stabilise now live in a new `stabilisers` field, which is not counted in volume.
  - Deadlift secondaries are now glutes, hamstrings and quads. Traps, forearms, lats and middle back are stabilisers. Calves are dropped. Basis: Martín-Fuentes 2020 EMG review.
  - Calves are dropped from the squat, lunge and bridge staples.

### Added
- **#5** `display_name` and `aliases` on all 111 staples.
- **#7** The `body_areas` enum (10 areas, 7 of them sided), a `body_areas` field on every exercise, and a top-level `body_area_map`.
- **#16** `equipment_detail` on every exercise (49-value enum). Hand-set on staples.
- **#17** `skill_tags` on every exercise (13-value enum). Hand-set on staples.
- **#6** A top-level `muscle_groups` map, plus `tr.global.muscle_group_rollup`. Group credit is the max of its members, not the sum; targets stay per muscle.
- **#8 / #4** `tr.global.effort_set_map` and `tr.global.effort_session_map`. "Hard session" is defined as Tough or Wrecked. This is wired into the new `pr.volume_progression.requires_structured` and `pr.deload.triggers.autoregulated_structured`. The existing text fields were reworded to match, and no keys were removed.
- **#9** `tr.global.warm_up`. Warm-ups are excluded from progression, e1RM and volume.
- **#10** `tr.global.e1rm` (Epley). **The cap is 10 reps, not 12:** Reynolds 2006 says to use no more than 10.
- **#11** `tr.global.swap_starting_load`. It uses ratios from Saeterbakken 2011 and Cotterman 2005, a ×0.9 margin, rounds down, and falls back to calibrating from the first set.
- **#12** A new safety rule, `pain_during_exercise`, routed to `modify_exercise`. It has an escalation ladder to 111, rest, and GP/physio. `pain_not_doms` is unchanged and still covers pain that persists after the session.
- **#19** `tr.global.push_pull_balance`, as a nudge only. No source supports a ratio.
- **#14** A `services` block in `safety_rules.json` covering 999, 111 by UK nation (NI has no 111), GP finder, MSK self-referral and CSP. Every rule now has a `services` list.
- **#15**
  - A `message` on every `sf.screening.matrix` entry, plus `result_messages` for each result.
  - A new `sf.screening.cleared_by_gp` path. Answering yes unlocks setup at light-to-moderate intensity; answering no saves progress, so the user isn't stuck.
- 22 new sources (53 in total). The `verification` counts are now 36 full_text, 5 abstract_only and 12 secondary_only.
- New build asserts:
  - body areas, equipment_detail and skill tags are valid enum values
  - every staple has a `display_name` and a primary area
  - screening messages are present on every result
  - every rule has `id`, `sources`, `evidence_strength` and `licence`
  - `muscle_groups` covers every muscle exactly once
  - the #1 regression check

### Couldn't do / deviations
- **The e1RM cap is 10 reps, not the ≤12 requested.** The evidence doesn't support 12. The app can still use 12, but it's off-data.
- **Push/pull** has no evidence-based ratio, so it's a weak nudge. Dropping it from the UI is also fine.
- **Mid-session pain:** "sharp" and the 5/10 threshold come from physio practice (a tendon RCT, secondary source). The NHS wording is "stop if your pain gets worse". The rule is marked moderate.
- **Warm-up ramp and swap ratios** are conventions or single-study figures (weak, engine_default).
- **Body areas, kit and skill tags** are heuristic on the 765 non-staples.
- **Non-staple secondaries** are not trimmed.
- **Service links:** GP finder and physio self-referral are England-only pages. Wales and Scotland have their own 111 sites, which are listed.
- **#18** food targets: deferred (P4).

## v0.1.1 (2026-09-22)

This is a tidy-up release. The structure is the same as v0.1.0 and no new domains were added.

### Added
- **Stable rule IDs** on every rule: `tr.*`, `pr.*`, `sf.*`. Safety red-flag IDs are unchanged. There are 56 IDs in total, listed in `data/rule_ids.json`, and each file's `notes[0]` states the `id_scheme`. *Why:* AI suggestions have to cite the rule they rely on.
- **Swaps are now `[{id, reason}]`, ordered best first.** Reasons: `same_pattern_diff_kit`, `easier_regression`, `harder_progression`, `same_muscle`. All 111 staples have hand-curated swaps in `staples.py`. *Why:* v0.1.0 matched on movement pattern alone, which gave bad swaps like Deadlift → Hyperextensions and Lat Pulldown → Pull-ups.
- **Cues** for the 111 staples, 2–4 each, written by us. Other exercises have none.
- **`load_convention`** on every exercise: `total`, `per_hand`, `per_side`, `bodyweight`, `bodyweight_plus` or `assisted`. *Why:* so dumbbell graphs and progression maths are right.
- **`increment_class`** on every exercise: `upper` or `lower`, matching the progression increments.
- **`enums` block** in `exercises.json`, covering muscles, equipment, patterns, load conventions, swap reasons and levels. The build asserts every exercise conforms.
- **`verification` field** on every source in `sources.json`: `full_text`, `abstract_only` or `secondary_only`.
- **`tr.conflict.endurance_rest`** records that NSCA and ACSM 2009 disagree on rest times for endurance work.
- The HPRC source (citing NSCA) was added to back up the increment figures.

### Changed
- **Equipment:** `none` is merged into `bodyweight`, which now covers 188 exercises.
- **Heuristic swaps** (non-staples): rankings now favour staples, then the same primary muscle, then the same equipment class and level, then a similar load. Bodyweight and band swaps are penalised for heavy barbell compounds. Exercises with no same-pattern match fall back to same-muscle swaps.
- **Exercises with no swaps:** 146 → 0. Mobility moves now swap within mobility.
- **Thrusters** are now `squat`, not `isolation`.
- **`tr.goal.endurance` rest** is now 45–90 s (was 30–60 s). ACSM 2009 recommends 1–2 min for sets of 15–20+ reps. The allowed range is still 20–120 s.
- **`pr.two_for_two` increments**, corrected against secondary sources citing NSCA:

  | | Upper, novice | Upper, trained | Lower, novice | Lower, trained |
  |---|---|---|---|---|
  | Before (kg) | 1–2 | 2–4 | 4–7 | 7–9 |
  | Now (kg) | 1–2.5 | 2.5–4.5 | 2.5–4.5 | 4.5–7 |

  The original lb figures are kept in `increment_lb_source`.
- **`pr.deload` detail (Coleman 2024):** a 9-week RCT found that the continuous group gained *more* lower-body strength, both isometric and dynamic. v0.1.0 said "slightly less", which understated it.
- **Maintenance doses (Spiering 2021):**
  - `maintenance_under_60` → `tr.dose.maintenance_younger`. The 20–35 age band isn't confirmed in the source, so it now just says "younger adults".
  - `maintenance_over_60` → `tr.dose.maintenance_older`. This now says "up to" 2 sessions/week and 2–3 sets, and that the dose is for muscle **size** only.
  - The safety rule `illness_below_neck` now points at `tr.dose.maintenance_younger`.
- **`tr.global.rpe_rir_map`:** added a note that novices estimate RIR less accurately, so progression shouldn't rely on RIR alone (Helms 2016, confirmed).
- **Grgic 2018** source URL now points at PubMed.
- **README:** corrected the no-swap count. v0.1.0 said 23; it was actually 146.

### Verified (no change)
- The Helms 2016 RPE–RIR mapping.
- Grgic 2018: trained lifters need >2 min rest for strength; untrained lifters are fine with 60–120 s.
- ACSM 2009, all three figures: +2–10% load after 1–2 extra reps on two consecutive sessions; the hypertrophy bands; the endurance bands.

### Couldn't fix
- The NSCA textbook's own increment table is paywalled and was not checked. The values come from two secondary sources, and the two disagree slightly.
- Seven more sources are still `secondary_only` because of paywalls or rate limits: Schoenfeld 2017, Robinson 2024, Refalo 2024, Androulakis-Korakakis 2020, Bell 2024, IOC REDs 2023 and Riebe 2015.
- The Spiering 2021 age bands need the full text, which is paywalled.

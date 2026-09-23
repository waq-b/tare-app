# Changelog

## v0.1.3 (2026-09-23)

This release covers two requests from the app build (Tare): starting weights from body stats, and bounds for learning a user's style. All changes are additive: no IDs, fields or enum values were removed or renamed. Numbers below refer to `docs/data-issues.md`.

### Added
- **#20 `tr.global.starting_load`.** It gives a conservative first working load per staple, worked out from sex, age, bodyweight, height (optional) and level. It includes:
  - A formula: reference mass × 1RM ratio × age factor × staple factor × first-session % × 0.9. The result is rounded down to the kit step.
  - 1RM ratios for 6 anchors (squat, bench, deadlift, OHP, lat pulldown, row), by sex (`male`, `female`; `prefer_not_to_say` uses the female ratios) and level (`beginner`, `intermediate`).
  - Age bands: flat to 40, then −1% a year to 50, −1.5% a year to 60 and −2% a year to 75. Over 75, calibrate instead.
  - First-session intensity: the inverse of Epley (`tr.global.e1rm`) at 4 reps in reserve. It's capped at 60% of estimated 1RM for beginners, 70% for intermediates and 50% from age 65.
  - Height is used only to cap bodyweight at a BMI of 25, because extra weight above that carries little extra strength.
  - 24 staples map to an anchor, with a factor and its basis. Per-hand dumbbell moves reuse 0.41 from `tr.global.swap_starting_load`, and the one-arm row reuses 0.4. Pulldown and cable row are marked `stack_dependent`.
  - The other 56 loaded staples (machines, cables, isolation moves, lunges, thrusts, kettlebells) are listed in `calibrate_instead` with a reason. So are all bodyweight moves.
  - First-session guidance: Easy or OK on every set. After set 1: Easy → +5–10%, OK → keep, Hard → −10%.
  - A rule for when the estimate is below the lightest option (e.g. the empty bar).
  - 4 worked examples (24 results), pinned by build asserts for the app's tests.
- **`pr.personal_adjustment`** (brief item 2, GitHub #93). It sets how far suggestions may drift towards how the user lifts:
  - Per exercise, after 4 or more sessions in a 6-session window, when 75% of them agree and the median gap is 5% or more.
  - At most ±10% in total and 5% a week.
  - Suggestions move up only if the heavier sets were logged Easy or OK with no pain flags.
  - Suggestions move down only if the suggested load was logged Hard or the reps fell short. Lifting lighter while logging Easy never lowers a suggestion.
  - Pace can slow by at most one extra session, or speed up to the top of the rule's increment range.
  - It never goes past goal ranges, increment ranges, screening `max_rpe`, pain flags, deloads, the new-user ramp or safety rules.
  - It resets on a pain flag, a swap, a break of 3 weeks or more, or when the user taps reset. It's always labelled and resettable.
- 21 new sources (74 in total). Verification is now 47 full_text, 14 abstract_only and 13 secondary_only.
- New build asserts:
  - every loaded staple is either mapped or in `calibrate_instead`
  - per-hand staples carry a per-hand factor
  - female ratios are below male, and beginner below intermediate
  - the age factor never rises and its bands join up
  - the worked examples match their pinned values and round down
  - personal-adjustment steps stay within the total cap

### Evidence calls
- **There are no peer-reviewed free-weight norms by sex and level for squat, deadlift, OHP and row.** The ratios lean on StrengthLevel crowd data (low evidence), set at its Beginner row (5th percentile) and Novice row (20th percentile). They sit at or below the Cooper bench norms (20th–40th percentile) and the untrained-trial baselines (Ma 2025, Pedersen 2022, Johnson 2009). Both rules are `weak` and `engine_default`.
- **Height adds nothing on its own once lean mass is known** (Folland 2008). The BMI-25 cap is our synthesis of the allometry and obesity evidence (Jaric 2002, Zoeller 2008, Tomlinson 2016). No study tests it directly.
- **Age decline** figures vary widely (0.8–3.6% a year in Fragala 2019; 1.5–3% a year after 50 in Keller 2013). The bands sit mid-range. No NHS figure was found.
- **Leg press, hack squat and other machines** calibrate instead. Machine norms don't transfer between makers (Brown 1998).
- **Personal-adjustment thresholds:** 4 sessions and a 5% gap are our defaults. 1RM varies about 4–5.5% between sessions (Grgic 2020), and no source gives a number of sessions.

### Couldn't do / deviations
- The ACSM leg press norms and the Kilgore/Rippetoe standards weren't used: the leg press table couldn't be found, and the Kilgore/Rippetoe standards couldn't be verified.
- "Dias 2018" (self-selected loads) was not found. Steele 2022 (a meta-analysis) covers the same point.

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

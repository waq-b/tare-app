# Changelog

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

# Changelog

App changelog for Tare. The dataset has its own changelog in `vpt/CHANGELOG.md`.

## Unreleased

### S0 — Repo setup (2026-09-22)

- npm workspaces (`packages/*`, `apps/*`), Node 24 LTS (`.nvmrc`, `engines`)
- Strict shared TS config (`tsconfig.base.json`), ESLint (flat config, typescript-eslint strict) + Prettier, EditorConfig
- Vitest at the root (passes with no tests until packages exist)
- GitHub Actions CI: install → lint → typecheck → test
- Housekeeping: project README replaces the stale dataset copy; app changelog moved here; `docs/plans/` created

### D1 — Storybook design library (in progress)

- **T14 screens: progress, body, food, notifications, flow (#38):**
  - Progress/Lifts: lift picker, a `ChartFrame` with its table, weekly sets against the fat-loss band, recent sessions.
  - Progress/Empty, Lifts table (sortable, with sparklines; the e1RM note comes from `tr.global.e1rm`), and Lift chart (full scrub chart plus table).
  - Progress/Body: 7-day average hero, trend chart, rate/waist/sessions/weigh-ins, heatmap, the active pain flag in its safety colour, health answers synced.
  - Log weigh-in: any frequency; charts use the 7-day average.
  - Food Today, Week and Not connected. The targets are labelled placeholders; the canvas's Morton source isn't in vpt, so it isn't shown.
  - Notifications: push mocks, centre, and settings (safety follow-ups locked on, ride nudges disabled "coming later").
  - Prototype/Today → review: a clickable Flow with a live rest countdown and effort tags. Its walk-through test logs three sets, finishes, and decides both changes.
  - Fixed: scrollable tables are now focusable labelled regions, `ChartFrame` takes a heading level, and heading order is right on every screen.
- **T13 screens: safety and pain (#37):**
  - One story per safety action, with a control to switch to any rule for that action, plus the Contact 111 light twin.
  - Modify exercise lists the exercises `pain_during_exercise` skips, from `body_area_map`.
  - The pain-flag sheet is redesigned (decision 4): where (all `body_areas`, with side), when (four timings, each mapped to its rule; the "sharp / above 5/10" threshold is labelled as a physio rule of thumb, not NHS guidance), then red-flag follow-ups (severe injury, can't bear weight, sprain, a hot calf for the calf area only, and "not sure"). There's an emergency shortcut to the 999 screen at the top.
  - The routing helper puts the most urgent answer first and only ever returns real rule IDs (6 tests).
  - Interaction tests walk the sheet twice: sharp shoulder pain during a set → Modify with its `user_message`; a hot swollen calf → 999 with `tel:999` first.
  - Pain flag history: a table (results use the fixed action labels), the lock note, and `BodyMap` front and back with active/cleared flags and sides.
- **T12 screens: onboarding, settings, coach (#36):**
  - Onboarding/Welcome shows "Not medical advice" once, in a disclaimer card.
  - Onboarding/Health shows the 5 `sf.screening` questions word for word. The msk area uses `enums.body_areas`, with a side picker for sided areas. The copy says the answers sync.
  - One Screening result story per result: a fixed UI title, then `result_messages` verbatim. GP-first stops setup and asks `cleared_by_gp`; "yes" and "not yet" have stories, and "not yet" offers GP finder and 111 from the data.
  - Goals includes all 5 goals from the data (the canvas omitted endurance). Level is beginner/intermediate. Kit and can't-do options come from `equipment_detail` / `skill_tags`.
  - Settings shows health answers "Synced to your account", safety follow-ups "always on", and the vpt version and source count from the data.
  - Connect your AI uses the short `get_coach_brief` bootstrap.
  - Coach: an interactive weekly review from the fixture review (+ light), kept with a reason, not enough data (text from `pr.new_user_ramp`; the rules list shows each rule's trigger/definition from the data), and a missed run.
- **T11 screens: workout, today, plan (#35):** 18 boards as screen stories, composed from components with fixtures (`stories/screens`).
  - Workout: Ledger (interactive), Ledger (light), Edit set, Rest timer, Swap sheet, Offline.
  - Today: Default, Default (light), Rest day, Deload week, Sync failed, Loading.
  - Finish: Default, Default (light), Sync failed.
  - Plan/Week, History/Session, Exercise/Detail.

  Everything shown is derived rather than copied from the canvas:
  - today's prescriptions include the accepted bench change;
  - warm-ups come from `tr.global.warm_up`;
  - swap options are filtered by kit and can't-do, with starting loads from `tr.global.swap_starting_load` (22 kg per hand, 50 kg Smith, otherwise "Easy first set");
  - the deload banner's numbers and caveat come from `pr.deload`;
  - Finish shows a PR only when the e1RM really beats the previous best;
  - the plan footer shows the vpt version and the next deload.

  Fixes found along the way:
  - light-theme contrast on a dimmed "+N more" link;
  - a skipped heading level on Session-Detail;
  - label wrapping in the last-time strip and the ghost buttons.

- **T10 food and notifications (#34):** `MealRow` ("Not logged yet" instead of a guess), `NotificationItem` (category tiles: safety, plan, coach, sync, deload; unread dot), `ResponseButtons` (≥48px), `PushNotification` + `AppMark` (an OS mock for reviewing push copy), and `QuietHoursCard` (safety follow-ups still come through). Stories only; wired in P2/P4
- **T9 charts (#33):** hand-rolled SVG on a small, tested scale module (bars and meters are always zero-based).
  - `LineChart`: compact or full, crosshair and tooltip, pointer and arrow-key scrubbing, Enter opens a point.
  - `TrendChart`: raw dots with the average as the line.
  - `TargetBars`: dashed no-data days and a target band. `TargetBandBar`: status in words (Below / In range / Above) instead of the canvas's warning colour.
  - `MacroBar` (direct-labelled series), `Meter` (native `<meter>`), `Heatmap`, `DayDots`, `StatTile`, `HeroNumber` (with an "estimated" / "imported" qualifier), `Sparkline`, `ChartTooltip`.
  - `DataTable`: sortable, with `aria-sort`, row headers and a caption.
  - `ChartFrame`: the chart/table toggle, so every chart has its table one tap away.
  - Every chart has a text summary for screen readers. Stories use fixture data; the Foundations/Charts page shows them all live.
  - The purity rule now also blocks bare `fixtures` imports in components (tested).
- **T8 coach and onboarding (#32):**
  - `ChangeCard` has three kinds and three states. Also `AcceptReject`, `DecisionStatus` (with Undo) and `ReasonPicker` (including a selected state).
  - `DiffChip` (large and compact), `EvidenceBadge` (strong, moderate or weak; "No evidence rating" when the data gives none).
  - `RuleChip` shows the real rule ID. `RuleCitation` combines the ID, evidence and first source (+N more), plus a "Tare default" tag when the rule is `engine_default`.
  - `WhyCard`, `ReviewSummaryCard` ("Written by your Claude"), `QuestionRow` (screening questions word for word from the data, with a follow-up slot) and `RankedChoice` (1st/2nd, capped).
  - Stories use the fixture review and real rules from `@tare/data`.
  - Interaction tests: accept → undo → keep with a reason; ranking goals.
- **T7 safety and health (#31):** `SafetyScreen` shows the fixed label for the rule's action, then its `user_message` word for word, its sources, and its services for the user's UK nation. 111 per nation; NI uses GP out of hours; England-only links carry the data's note outside England. Emphasis comes from the safety tokens: solid 999, tinted fill, amber accent for caution. Unknown future actions fall back to the cautious GP presentation. **Tests over all 21 rules:** each message is verbatim, the screen adds no copy of its own (a negative check with injected text fails all 21), and every source and service is linked. Also `SourceLink`, `SafetyLockNote`, `EmergencyShortcut`, `IconList`, `RemovedItemList`, `DisclaimerCard`, `PainFlagCard` (in its safety level's colour, not the canvas's swap blue), `Legend`/`ChartLegend`, and `BodyMap` in `@tare/icons`: all 10 vpt `body_areas`, left/right correct per view. `Button` gained links (`href`, external) and an `emergency-outline` variant for the red screen. Fixed: the ui unit-test config ignored `*.test.tsx`
- **T6 workout components (#30):** `NumberStepper` (tap to type), `IncrementChips` (deltas passed in; stories derive them from `pr.double_progression`), `EffortTap` (set/session scales, mapped to RPE by the app via `tr.global.effort_*_map`), `WorkoutTopBar` (flag pain always one tap away), `ExerciseHeader`, `LastTimeStrip`, `SetRow` (warm-up/done/current/upcoming; one tap logs as planned; clear warm-up labels, fixing the canvas's duplicate labels), `WorkoutFooter`, `RestTimer` (full ring + docked; the app owns the countdown), `SwapRow`, `ComparisonRow`, `SessionHeader`, `Prescription`, `ExerciseCard` (+ skeleton), `WeekStrip`, `PlanDayRow` + `SessionBadge`, `SessionExerciseBlock` + `SetPill`, `StepList`, and shared `load_convention` formatting ("per hand", "per side", "BW"). Interaction tests: logging a set, stepping/typing, rest ±15s/skip. The selected swap row uses the card surface, not a tint, so the tinted "Best match" tag keeps 4.5:1 in light
- **T5 primitives (#29):** `IconButton`, `TextLink`, `Tag` (8 tones, text on `-on-tint`), `Card`, `IconTile`, `SectionLabel`, `SectionHeader`, `InlineNote`, `StatusDot`, `Skeleton`, `Sheet` (in-frame, focus trap, Escape, reduced motion fades), `StepProgress`, `TopBar` (root/tab/back/onboarding), `BottomNav`, `ListRow` (nav/history/option/key-value/compact/disabled), `Switch` + `ToggleRow` (incl. locked "always on"), `Checkbox` (row/tile), `RadioCard`, `ChoiceChip`, `SegmentedControl` (a real radio group with arrow keys), `FieldButton`, `CopyField`, `PromptBlock`, `Banner` (7 tones; offline/info neutral), `StatusHero`, `EmptyState` (centred/left + slots for the not-enough-data and missed-run variants), `PlaceholderAction`. Every target ≥48px. Interaction tests: Sheet keyboard, Switch, ChoiceChip, SegmentedControl. Story tests: axe runs on both themes; duplicate-landmark rules are off only in Both mode (they fire because each story renders twice). Focus-moving effects are the one kind of effect allowed in components (UI only: no data, storage or network)
- **T4 foundations and reference stories (#28):** Foundations/Tokens (live colour, type, space, radius, elevation, motion, touch and safety levels, with dark · light values), Foundations/Icons (all icons; muscle maps from `exercises.json`), Brand/Names, the Foundations/Components and Foundations/Charts index pages, and Reference/Workout-B and Workout-C ("not built", decision 15). Brand components: `Wordmark`, `MiniquestTag`, `MiniquestPip`. New token `--miniquest-tag`: the brand dim was 3.26:1 on the light page, so light uses `#6C6389` (same hue, 4.95:1), with a contrast test. Bundle: vpt data is 1.96 MB (288 KB gzipped) in Storybook, loaded only by stories that use it
- **T3 fixtures (#27):** a fictional user ("Sam") on CLAUDE.md §10 defaults, 8 weeks of logs simulated under the real rules, read through `@tare/data`: double progression, warm-ups, a week-6 deload (volume cut to the middle of `pr.deload`'s range), one lat-pulldown stall, and e1RM via Epley capped at 10 reps. There's a week-8 coach review whose changes are all justified by the logs: bench and incline press topped their ranges twice; the stall reset cites `pr.stall.step2`; the hamstrings volume proposal uses computed weekly sets (1.5, under the minimum of 4). Also pain flags (`pain_during_exercise`, `suspected_sprain_strain`), screening answers (`msk_issue=yes` → modify), weigh-ins at any frequency with a 7-day average, notifications, and food targets named `FIXTURE_*` (vpt has none, #20). 16 consistency tests
- **T2 `@tare/ui` + Storybook (#26):** React 19, Vite 8, CSS Modules on tokens, self-hosted fonts. Storybook 10 with a Dark / Light / Both theme toolbar and a 390×844 viewport; a11y violations are errors. Every story runs as a browser test (addon-vitest + Playwright Chromium) and renders in **both themes under test**, so axe checks dark and light at once (a guard story proves it). Purity lint rule: components can't import `@tare/data`, `vpt/` or fixtures, or use network or storage (tested). Component CSS can't contain raw colours (tested). `Button` built as the first component. CI installs Chromium, runs story tests and builds Storybook. Vitest pinned to 4.x (`addon-vitest` doesn't support 5 yet). `eslint-plugin-jsx-a11y` left out: it doesn't support ESLint 10, and axe on every story is the stricter gate
- **T1 `@tare/data` (#25):** the only loader for `vpt/`. zod schemas for all six files, loose (unknown fields and enum values pass; missing fields fail), and `MIN_VPT_VERSION = 0.1.2`. A safety rule with `llm_can_override` not `false` refuses to load. A rule index resolves every ID in `rule_ids.json` to one shape for the "why" UI (label, evidence, sources); stall steps and screening questions inherit their parent's sources, and `tr.conflict.*` honestly has none. Accessors: `exercise`, `displayName` (fallback marked), `rule`, `safetyRule(s)`, `screening`, `services`, `source`, `goal` (inheritance and overrides resolved), `muscleGroupOf`, `exercisesLoading`

### Chip text on tints (2026-09-22, #24)

- New tokens `--<c>-on-tint` for every tint colour (accent, progress, hold, deload, swap, warning, safety-stop), in both themes. Light progress, swap, warning and safety-stop are darker (same hue); the rest equal their base colour. Fills unchanged
- Contrast test: every on-tint colour passes 4.5:1 on its tint over `bg` and over `surface-1`, in both themes, and keeps the base colour's hue (within 1.5°) and saturation. The four light tint exceptions are gone

### Contrast decisions (2026-09-22, #18)

- Light `progress` darkened from `#1D7F4A` to `#1C7A47` (4.47 → 4.77:1 on `bg`, 5.35:1 on `surface-1`). The Tokens-board test records it as a deliberate deviation
- New contrast test: each semantic colour as text on its own tint, over `bg` and `surface-1`. Dark passes everywhere. Four light colours fail over `bg` (pass on cards), so they're listed as exceptions and opened as decision #24
- DESIGN.md contrast table now records the decision for every exception

### vpt v0.1.2 upgrade routine (2026-09-22, #19)

- Read the v0.1.2 changelog and data-issues status lines; the data wins where it differs
- `docs/DESIGN.md` updated to v0.1.2:
  - Safety-Modify's level is now right (`pain_during_exercise` → `modify_exercise`, with its escalation ladder); the wording is still the rule's `user_message`
  - data sources filled in for effort maps, warm-ups, e1RM (≤10 reps), swap start loads (70 kg bench → 24–25 kg DBs per hand), muscle groups (max, not sum), body areas, screening `result_messages` and `cleared_by_gp`, `services`, `display_name ?? name`, "per side" loads, push/pull as a nudge
- Tests pass on v0.1.2 unchanged. Re-running `extract.ts` gives identical enums (all v0.1.2 changes are additive)
- No loader yet, so there's no `MIN_VPT_VERSION` or `FALLBACK` markers to switch. The zod loader (`packages/data`) is proposed as the first D1 task
- Still open: food targets (#20, P4)

### Task tracking (2026-09-22)

- GitHub labels, milestones (S0–P4) and the "Tare" Project board, via `scripts/setup-github.sh`
- Back-filled S0 (#1–#5) and D0 (#8–#16) as closed issues with their commits; open: D0 sign-off (#17), contrast follow-up (#18), vpt v0.1.2 upgrade routine (#19), food targets (#20, waiting on data), board workflows (#7), and three `later` ideas (#21–#23)
- vpt v0.1.2 committed on its own (`data: vpt v0.1.2`); `prompts/` is now local only

### D0 — Tokens + DESIGN.md (2026-09-22, awaiting sign-off)

- `@tare/tokens`: `tokens.json` is the single source (colour for dark + light, tints, safety levels, brand, fonts, type, space, radius, touch, elevation, motion). `npm run build` generates `dist/tokens.css` (dark on `:root`, `[data-theme="light"]` override, reduced-motion block) and typed `dist/index.js` + `index.d.ts` (`tokens`, `cssVar()`, `CssVarName`, `SafetyAction`…)
- Tests: every swatch on the Tokens and Charts boards matches `tokens.json`; both themes share keys; every `safety_rules.json` action has a safety token; WCAG contrast for both themes, with 5 canvas exceptions listed for review
- Added `type.caption` (13px), which screens use heavily but the Tokens board omits
- CI now runs `npm run build` before lint/typecheck/test
- `@tare/icons`: `Icon` (all 50 interface icons, typed `IconName`), `PatternIcon` (typed from the vpt `movement_pattern` enum; 4 patterns without a drawing reuse `bike`/`dumbbell`) and `MuscleMap` (front/back, primary/secondary, typed from the vpt `muscles` enum). Decorative by default, labelled `role="img"` with `title`. Geometry comes from `scripts/extract.ts` (re-runnable against the canvas), and colours come from `currentColor` and tokens. There's one `Icon` component with a typed `name`, not one component per icon
- Tests: every icon on the Icons board exists and renders; enums match `vpt`; the muscle map reproduces the canvas deadlift drawing shape for shape; muscles with no drawn region (neck, abductors, adductors) are pinned
- Sign-off gallery: `npm run gallery -w @tare/icons` writes a self-contained HTML page with both themes (swatches, tints, safety levels, type, space, radius, elevation, icons, muscle map), with fonts self-hosted from `@fontsource`
- Added `type.button` (17/600), used by every screen board for button labels and card titles
- `docs/DESIGN.md`: principles, tokens (with off-token decisions, the safety levels and contrast exceptions), a component inventory (~90 components with variants, states, boards and data sources, from a sweep of all 60 boards), the screen inventory (all 60 boards with status, D1 story, phase and data), placeholder copy to ignore, and design gaps. `npm test` runs `scripts/check-design-md.ts`, which fails if a board or a named component is missing
- `docs/data-issues.md`: 19 issues for the data session (e.g. two bench machines tagged `pull_v`, no short display names, no body-area enum, no effort → RPE mapping)

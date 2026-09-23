# Changelog

App changelog for Tare. The dataset has its own changelog in `vpt/CHANGELOG.md`.

## Unreleased

### S0 — Repo setup (2026-09-22)

- npm workspaces (`packages/*`, `apps/*`), Node 24 LTS (`.nvmrc`, `engines`)
- Strict shared TS config (`tsconfig.base.json`), ESLint (flat config, typescript-eslint strict) + Prettier, EditorConfig
- Vitest at the root (passes with no tests until packages exist)
- GitHub Actions CI: install → lint → typecheck → test
- Housekeeping: project README replaces the stale dataset copy; app changelog moved here; `docs/plans/` created

### P1 — Rules engine (building; ships to the phone after the P0 two weeks, #90)

- **T1 progression engine (#76, on the `p1` branch):** `nextTarget` gives each exercise's next load and reps from its logged sessions. It uses `pr.double_progression` (fat loss, hypertrophy, general, endurance): top of the range on every set at or below the target effort, 2 sessions in a row at the same load → up by `increment_pct` (at least `increment_kg_min`) for the lift's class, rounded up to the kit step, reps back to the bottom; otherwise one more rep, or hold after a Hard set. `pr.two_for_two` covers strength. The target effort is the goal's `intensity_rpe` capped by screening's `max_rpe`; an untapped set counts as OK (#89). The rules are validated in `@tare/data`; their trigger numbers are text only and parsed loudly (`FALLBACK(vpt-issue #22)`)
- **T12 suggested starting weights (#92):** from `tr.global.starting_load`: reference mass (bodyweight, capped at BMI 25 with a height) × 1RM ratio (sex, level, anchor) × age factor × staple factor × first-session % × safety margin, rounded down to the kit step. Every number is read from the rule.
  - The engine's `suggestStartingLoad` is tested against all 24 worked examples, including the lightest-load outcomes (use the empty bar when it's a small enough share of the estimate; otherwise a lighter kit or a calibration set). Staples the rule lists in `calibrate_instead` start with an easy set, with its reason.
  - Onboarding has a skippable "About you" step (sex, age, weight, optional height), and the weight becomes the first weigh-in. "Your plan" shows how many exercises got a suggestion, each as an editable "estimated" placeholder, with hints for stack-dependent machines and below-the-bar results. Settings → About you edits the stats.
  - Today and the workout use the estimate when there's no logged or typed weight, labelled "Estimated from your body stats". Pulldowns and cable rows say "a rough guide".
  - The first session on an estimate shows the rule's label, and each set's effort adjusts the next (Easy up 5–10% in kit steps, Hard down 10%, at most twice), per `first_session`.
  - Kit defaults per decision #88: barbell 2.5 kg steps (1.25 kg plates) from a 20 kg bar, dumbbells 2 kg, stacks 5 kg.
  - Also fixed: onboarding dates used UTC, so a late-evening GP clearance could be dated tomorrow
- **vpt v0.1.3 upgrade (#75):** `MIN_VPT_VERSION` 0.1.3. `tr.global.starting_load` is validated with its own schema and exposed as `startingLoadRule()`. Three constants that exist only inside formula text (BMI cap, first-session reps in reserve, lightest-load share) are parsed loudly, marked `FALLBACK(vpt-issue #21)`. `pr.personal_adjustment` loads (unbuilt: #93 is later). No other fallbacks were resolved (#5 display names is unchanged by design). The app bundle is now 100 KB gzipped

### P0 — Logging app (in progress)

- **After the first run on the phone (2026-09-23):**
  - **PWA spacing:** the notch and home-bar gaps were padded twice (the shell and the top bar and nav each added them), leaving a big gap at the top and an odd strip under the nav in the installed app. Now only the components pad, and screens without a top bar (Welcome, Sign in) pad for the notch themselves.
  - **Sync sooner:** changes now sync about 3 seconds after they're made. It used to wait for the next 5-minute pass, which an installed app in the background can miss.
  - **"Your plan":** onboarding ends on a review of what was built and why: each session's exercises with sets × reps, sets per week per muscle against your goal's target band, what changed for your kit or a flagged area, and the rules behind it. Starting weights are optional, tucked under "Starting weights · optional". Weights from body stats wait on the data session (#75).
  - **Restore instead of re-onboarding:** on iPhone, Safari and the Home Screen app don't share storage, so Waqar was set up twice. Now, after sign-in on a phone with no profile, the app shows "Looking for your data…" and checks the server first. If the account has data, it comes back and onboarding is skipped. If two copies each made an active plan, the newest wins.
  - **Update and start-up screens:** tapping Update shows "Updating Tare…" until the new version loads, and a cold start shows the wordmark on the dark background instead of a blank flash
  - **Onboarding finishes all or nothing:** a reload or closed app part-way can no longer leave a profile without a plan
- **T13 end-to-end + data-loss tests (#63):** Playwright on a phone viewport against the built PWA (`npm run e2e -w @tare/web`, in CI; traces uploaded on failure).
  - One run covers: sign in, onboard with starting weights, a whole 14-set workout with the network off, a reload mid-workout that comes back on the same set, finish, then reconnect and sync by itself (every record reaches the API). It then exports a backup and restores it on a fresh phone with no API.
  - The E2E build (`vite --mode e2e`) uses a fake sign-in and `e2e/mock-api.ts`, which has the API's push/pull rules; production builds never take that branch.
  - Found and fixed on the way:
    - **Double tap:** the workout footer changes meaning in place, so a quick second tap on "Next exercise" logged the next exercise's first set. Taps within 600 ms of the last are now ignored (with a test that fails without the guard).
    - **Restore on a new phone:** a fresh phone can restore a backup from Welcome ("Restore from a backup"), before onboarding
- **T11 sync client (#61):**
  - Background sync at start, on reconnect, on return to the app, after finishing a workout, and every 5 minutes, with backoff (30 s to 5 min) after a failure; logging never waits for it.
  - A pass pushes the outbox, squeezed to the latest copy of each record, in batches of 500. Rows queued during a push stay and go next. Then it pulls from the saved cursor, applying last-write-wins with the same schemas (a mismatching record is counted, not applied), and pulled records are never queued back.
  - Each record's `updatedAt` now always goes up, even for two edits in the same millisecond, so the server never drops a newer edit.
  - The D1 states: "Offline: logging still works" (Today and the workout), "N changes haven't synced" with Retry, "Sign in again to sync" (sign-in stays open for a remembered account whose session expired), and "Synced · time" on Finish.
  - Tested against an in-memory server with the API's rules: offline then online, squashing, edits during a push, a second device pulling everything, conflicts both ways, and every failure keeping the outbox
- **T10 sync API (#60):** `apps/server`, Fastify on Node 24 (runs the TypeScript directly).
  - `GET /health`; `POST /sync/push` applies an outbox batch (up to 500) last-write-wins by `updatedAt`, so replays and older copies change nothing; `GET /sync/pull?since=` returns changes after a cursor (a global sequence bumped on every change), paged.
  - Postgres via one `DATABASE_URL`, with SQL migrations applied at start-up. One `records` table keyed by (user, table, id) holds the app's JSON. **RLS is on everywhere**: each request runs as `authenticated` with the caller's claims, so Postgres refuses other users' rows. The allowlist and migrations tables have no grants for app roles.
  - Supabase tokens are verified with `jose` against the JWKS (issuer and audience checked, ES256/RS256 only), as in pip: 401 without a valid token, 403 if the email isn't allowlisted. CORS for the app's origins only.
  - `npm run allow -w @tare/server -- <email>` adds someone to the allowlist and, with the Supabase secret key, creates their account.
  - Tests run on a real Postgres (throwaway database per run; a service container in CI): round-trip, idempotent replay, last write wins, soft deletes, malformed batches, auth failures, and RLS proving one user can't read or forge another's rows
- **T9 progress, history, body (#59):**
  - Progress → Lifts: headline-lift chips, the e1RM chart with its table one tap away ("not enough data yet" before two sessions), sets this week per muscle against the goal's band for your level (`tr.goal.*`, fractional counting via the engine), an all-lifts table (top set, e1RM, 6-week change, trend), and recent sessions.
  - History: every finished session, and a detail view with working sets, hardest effort and PR tags.
  - Progress → Body: the 7-day average bodyweight, a trend chart after two weigh-ins, rate (after 2 weeks), waist, sessions and weigh-ins, a 9-week consistency heatmap, the active pain flag with its rule's message verbatim ("Feels clear" clears it), and health answers. The weigh-in sheet logs at any time, with an optional waist.
  - The numbers come from pure functions, tested against logged data
- **T8 pain flag → safety (#58):**
  - Flag pain from the workout's top bar opens the D1 pain sheet: area and side, when, red-flag signs, "not sure", and a chest-pain shortcut. The engine routes the answers (`routePainFlag`), the flag is saved, and the safety screen shows the rule's `user_message` word for word with its services for your nation.
  - What comes next follows the action. `modify_exercise` applies the engine action to the session in progress: the current exercise stops, and the rest that load the area as primary (`body_area_map`) are skipped and listed. If nothing is left, the workout says "That's all for today". Stop-level results end the session; `reduce_or_rest` offers both; caution goes back to the workout.
  - While a flag is active, the next sessions leave out the exercises that load that area, and Today says so. Pain flags (from Settings): history table, body map, "It's settled" to clear a flag, and flagging pain outside a workout.
  - Tested for every rule: the app's safety screen shows all 21 messages verbatim, plus one route per action level
- **T7 the workout (#57):**
  - The Ledger: the engine's warm-ups (tap to tick, never counted), working sets aiming for the start load or the last logged weight (#70), and target reps from last time within the rep range. One tap on Done (or the current set's check) logs the set as planned; the check on a done set undoes it.
  - With no known weight, Done becomes "Enter weight" and opens the edit sheet (steppers, increment chips from `pr.double_progression` typical jumps, "use this weight for the rest of the sets").
  - Add set and skip set build on the latest saved state, so quick taps all count.
  - The rest timer runs on wall-clock time (the end moment is saved), so it survives a locked screen, backgrounding and reloads. It buzzes at the end and docks above Done when the sheet is closed. Optional effort per set.
  - Swap sheet: kit-filtered swaps with engine start loads, "Swap today" or "Swap in plan", allowed before the exercise's first set.
  - Finish: time, volume (both hands for dumbbells), sets, real e1RM PRs, "beat last time", and an optional feel; Done closes the workout.
  - The workout and its position are saved as they change, so it resumes after a reload, crash or closed app. Today now shows "Done for today" even without a plan
- **T6 Today, Plan, Exercise detail (#56):** Today: the week strip (done, planned, rest, today), today's session with the load to aim for (the last working load from a finished workout, else the starting weight, else "easy first set", #70), warm-up and per-hand sublines, and Start workout. Also a Resume banner for a workout in progress, "Done for today", and a rest day showing the next session. Plan: the week and each session's exercises. Exercise detail: muscle maps, cues, e1RM from your own sets (`tr.global.e1rm`; "Not enough data yet" before two sessions), recent sessions, a why card citing your goal's rule, and swaps for your kit with engine start loads. Everything reads live from Dexie, so a logged session updates the screens at once. Fix: history and prefill go by the workout's date, not when the sets were typed in
- **T5 onboarding (#55, part 2):** Welcome ("Not medical advice", once), health questions (the 5 `sf.screening` questions word for word, plus where you live for NHS links), the result from the engine with its message verbatim, the `cleared_by_gp` follow-up (yes carries on; no shows NHS links and saves the answers without letting setup go on), goals, days, length and level, then kit and can't-do. Starting weights (#69): one field per exercise, blank = an easy calibration set. Finishing writes the profile, screening record and the seeded plan, then opens Today. The seed plan is the D1 structure (Tue/Thu/Sat, or 2 days), with reps, sets and rest from the goal. Exercises ruled out by kit or can't-do, or that load an area flagged at screening (`modify`), are swapped for a curated swap that fits, or left out, and the screen says which. Answers are kept in a draft, so a reload loses nothing. P0 logs in kg and dumbbells per hand only (lb and "total" are a `later` issue)
- **T5 sign-in (#55, part 1):** email code sign-in like pip (#68). New `TextField` component (`default` / `code`, with a story; DESIGN.md §3.8). An `AuthClient` wraps Supabase (screens never import it; tests use a fake): `signInWithOtp` with `shouldCreateUser: false`, `verifyOtp`, and an answer that never shows whether an address has an account. The sign-in screen takes an 8-digit code that checks itself once when complete (pasted text is stripped to digits), with messages for a wrong code, too many tries and too many emails. The account is remembered on the phone, so the app opens and logs offline with no session. An expired session will only pause sync (T11). Settings → Account: signed in as, sign out (logs stay). Supabase project `tare` created (free, London). Dashboard steps and the email template are in `docs/supabase/`
- **T4 local data layer (#54):** Dexie tables for profile, screening, plans, workouts, sets, weigh-ins, pain flags, outbox and meta. Records get phone-made UUIDv7 IDs, `updatedAt` and soft deletes, and are checked with zod. Every write saves the record and queues it for sync in one transaction (a failed queue rolls the save back). Repositories cover what P0 screens need, including resume (`workouts.unfinished`) and the last working load for prefill (#70). Settings → Data: export everything as a JSON backup and restore one (checked whole before anything is written; newer changes always win; restores queue for sync). The app asks the browser to keep its storage, and Settings shows the answer. 30 data-layer tests on `fake-indexeddb`
- **T3 web scaffold + PWA (#53):** `apps/web`: Vite + React + React Router 8, `@tare/ui` styles, routes for the 4 tabs and every drill-in (placeholders until T5–T9), bottom nav on tab screens only, and plain `@tare/ui` links routed in-app. `vite-plugin-pwa`: manifest in `en-GB` with token colours, icons drawn from the "0.0" mark (`npm run icons -w @tare/web`), everything precached (shell, fonts, data), and an update prompt so a new version never lands mid-workout. The app resolves `@tare/data` to the slim bundle (`tare-app` condition). Checked in a browser: with the server stopped, `/plan` reloads offline with its fonts
- **T2 app data bundle (#52):** `npm run build -w @tare/data` writes `dist/vpt-app.json`: every rules file in full plus 252 exercises (the 111 staples and every swap they offer; swap targets' own swaps trimmed to the set; provenance fields dropped). 91 KB gzipped. It passes the same schemas and version check. `@tare/data` picks its files through a `#vpt-source` import: the full set by default, the bundle under the `tare-app` condition (the web app). Tests fail if the bundle is stale or any staple, swap or plan exercise is missing
- **T1 engine (#51):** new `packages/engine`, pure functions over the vpt rules, each result citing the rule IDs it used:
  - `evaluateScreening`: `sf.screening` matrix rows (all 32 answer combinations tested), with the most cautious row leading, the lowest effort cap kept, msk areas flagged, and the `cleared_by_gp` follow-up. Messages are shown verbatim
  - `routePainFlag` (moved from the D1 story helper, same tests) and `modifyForPainFlag` (`pain_during_exercise`: stop the current exercise, skip the rest that load the area as primary per `body_area_map`)
  - `e1rm`, `needsWarmUp`/`warmUpSets`, `swapStartLoad` (ratio × margin, rounded down, or a calibration set), `swapOptions` (kit + can't-do filter), `weeklySets` (fractional per muscle, display-only group roll-up)
  - The D1 fixtures and screen stories now call the engine (one implementation); the onboarding result stories get their result from real answers. A lint rule keeps the engine free of I/O, clocks and randomness

### D1 — Storybook design library (built, deployed and signed off 2026-09-23)

- **Layout fixes after review (2026-09-23):** Waqar spotted sideways scrolling on the Coach screens. Cause: `DiffChip` never wrapped, so long diffs ("2 sets in Session A from the next block") pushed up to 155px past the 390px frame.
  - New layout check after every story test: nothing may spill past the story frame, nothing may scroll sideways (except labelled table regions and deliberate "…" truncation), and visible text may not overlap. Text is clipped to its scroll area first, and content behind an open sheet is skipped. A guard story proves it catches both a spill and an overlap.
  - It found and fixed: `DiffChip` (now wraps), the "Last time" strip (sets were cut off; now on their own line), full-width buttons (long labels like NI's "GP out of hours service…" now wrap), and the Tokens page (long names ran into the next column)
- **T17 close-out (#41):** demo note and "built vs plan" in `docs/plans/D1.md`, DESIGN.md §3.7 (what D1 added beyond the canvas), polish filed as `later` issues #45–#49
- **T16 deploy (#40):** Storybook is live at https://tare-storybook.onrender.com, a free Render static site that auto-deploys from `main` (build `npm ci && npm run build && npm run build-storybook -w @tare/ui`, `NODE_VERSION=24`). It's public, with `noindex` in the manager and preview and a `robots.txt` blocking crawlers. Fixture fix: "Warm-up sets included" now only shows on the first exercise of each movement pattern, as in the logs
- **T15 quality gates (#39):**
  - `scripts/check-stories.ts` (`npm run check:stories`, run in CI after the Storybook build) proves every board's D1 story from DESIGN.md §4 exists, and that all 96 components in §3 have a story. It found 12 gaps, now filled; DESIGN.md §4 now lists Connect-AI under Settings.
  - Touch targets: after every story test, every interactive element must be ≥48×48 (labels count for checkboxes and radios). A guard story proves the check catches a 32px button. It found the Undo button, a sortable header and a short text link, all fixed.
  - a11y: axe with zero violations in both themes, on all 306 story tests.
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

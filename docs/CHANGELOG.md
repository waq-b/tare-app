# Changelog

App changelog for Tare, newest first, grouped by area. The dataset has its own changelog in `vpt/CHANGELOG.md`.

## Rules engine: progression, stalls and deloads

- `nextTarget` gives each exercise's next load and reps from its logged sessions, using double progression (or two-for-two), with the smallest jump taken from your kit settings.
- Stall detection with stepped responses, planned and early deloads, a new-user ramp and a volume block, all as pure functions in `packages/engine` that return the rule IDs they used.
- Suggested starting weights from body stats (`tr.global.starting_load`), conservative and changeable.
- A first session back after a cleared pain flag, at the rule's share of the previous load.
- Today, Plan and the workout take each exercise's target from the engine. A changed prescription shows a chip (+5, -5, Deload, Lighter), and the exercise's "Why today" card explains it with the rules. An increase can be kept at last time's weight with one tap.
- Settings → Weight steps sets the smallest jump and lightest option for barbells, dumbbells and machines.
- Coach tab: before the ramp rule's weeks of logs it says "Not enough data yet" with a week tracker and the rules running now; after that it shows a rules-only summary. There is no AI review yet.
- An 8-week simulation of a model lifter is checked against a golden snapshot, plus invariants (loads only go up, and only after two top-of-range sessions at the same load).
- Fixed: cutting each exercise's sets on its own could not land in the deload's 40-50% range, so `deloadSets` now cuts across the whole session.
- Dataset minimum raised to vpt 0.1.3.

## Logging app

- Offline-first PWA on Dexie, with typed, zod-validated tables for profile, screening, plans, workouts, sets, weigh-ins, pain flags, an outbox and meta.
- Sync client and API (`apps/server`, Fastify on Node 24, Postgres with row-level security): push outbox batches, pull changes since a cursor.
- Email-code sign-in through Supabase, remembered offline.
- Onboarding with screening, goals, kit and units, ending on a "Your plan" screen.
- Today, Plan, Exercise detail, the workout screen (Ledger), rest timer, swaps filtered by kit, finish summary, progress charts, history and weigh-ins.
- Pain flag to safety screen: the matched rule's message is shown verbatim.
- Restore instead of re-onboarding: on iPhone, Safari and the Home Screen app do not share storage, so after sign-in on a phone with no profile the app offers to restore from sync.
- End-to-end and data-loss tests with Playwright on a phone viewport against the built PWA.

## Storybook design library

- `@tare/ui` (React 19, CSS Modules on tokens, self-hosted fonts) with a Storybook story for every board of the design, in both themes.
- Quality gates: axe accessibility checks (violations are errors), a 48px touch-target gate, and a contrast test over the tokens.
- Fixtures built around a fictional user and 8 weeks of simulated logs under the real rules.
- Layout fix: `DiffChip` now wraps, which cured sideways scrolling on the Coach screens.

## Tokens and design notes

- `packages/tokens`: one JSON source for colour, type, space, radius, touch, elevation, motion and safety levels, generated to CSS variables and TypeScript.
- Contrast decisions: light-theme progress green darkened to pass 4.5:1; chip text uses on-tint tokens instead of changing fills.
- `docs/DESIGN.md` is the design system and build checklist, checked in CI against the design boards.

## Repo setup

- npm workspaces, Node 24, strict shared TypeScript config, ESLint and Prettier, Vitest, GitHub Actions CI.

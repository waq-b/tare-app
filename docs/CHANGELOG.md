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

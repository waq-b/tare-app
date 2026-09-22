# Changelog

App changelog for Tare. The dataset has its own changelog in `vpt/CHANGELOG.md`.

## Unreleased

### S0 — Repo setup (2026-09-22)

- npm workspaces (`packages/*`, `apps/*`), Node 24 LTS (`.nvmrc`, `engines`)
- Strict shared TS config (`tsconfig.base.json`), ESLint (flat config, typescript-eslint strict) + Prettier, EditorConfig
- Vitest at the root (passes with no tests until packages exist)
- GitHub Actions CI: install → lint → typecheck → test
- Housekeeping: project README replaces the stale dataset copy; app changelog moved here; `docs/plans/` created

### D0 — Tokens + DESIGN.md (in progress)

- `@tare/tokens`: `tokens.json` is the single source (colour for dark + light, tints, safety levels, brand, fonts, type, space, radius, touch, elevation, motion). `npm run build` generates `dist/tokens.css` (dark on `:root`, `[data-theme="light"]` override, reduced-motion block) and typed `dist/index.js` + `index.d.ts` (`tokens`, `cssVar()`, `CssVarName`, `SafetyAction`…)
- Tests: every swatch on the Tokens and Charts boards matches `tokens.json`; both themes share keys; every `safety_rules.json` action has a safety token; WCAG contrast for both themes, with 5 canvas exceptions listed for review
- Added `type.caption` (13px), which screens use heavily but the Tokens board omits
- CI now runs `npm run build` before lint/typecheck/test
- `@tare/icons`: `Icon` (all 50 interface icons, typed `IconName`), `PatternIcon` (typed from the vpt `movement_pattern` enum; 4 patterns without a drawing reuse `bike`/`dumbbell`) and `MuscleMap` (front/back, primary/secondary, typed from the vpt `muscles` enum). Decorative by default, labelled `role="img"` with `title`. Geometry comes from `scripts/extract.ts` (re-runnable against the canvas), and colours come from `currentColor` and tokens. There's one `Icon` component with a typed `name`, not one component per icon
- Tests: every icon on the Icons board exists and renders; enums match `vpt`; the muscle map reproduces the canvas deadlift drawing shape for shape; muscles with no drawn region (neck, abductors, adductors) are pinned
- Sign-off gallery: `npm run gallery -w @tare/icons` writes a self-contained HTML page with both themes (swatches, tints, safety levels, type, space, radius, elevation, icons, muscle map), with fonts self-hosted from `@fontsource`

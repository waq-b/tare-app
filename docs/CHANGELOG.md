# Changelog

App changelog for Tare. The dataset has its own changelog in `vpt/CHANGELOG.md`.

## Unreleased

### S0 — Repo setup (2026-09-22)

- npm workspaces (`packages/*`, `apps/*`), Node 24 LTS (`.nvmrc`, `engines`)
- Strict shared TS config (`tsconfig.base.json`), ESLint (flat config, typescript-eslint strict) + Prettier, EditorConfig
- Vitest at the root (passes with no tests until packages exist)
- GitHub Actions CI: install → lint → typecheck → test
- Housekeeping: project README replaces the stale dataset copy; app changelog moved here; `docs/plans/` created

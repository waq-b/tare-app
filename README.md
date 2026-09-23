# Tare

A mobile-first PWA gym logger with an honest AI coach. Part of **miniquest** (`tare.example.com`).

- **Log sets fast.** One tap logs a planned set, offline-first
- **Plan + progress.** Weekly plan, lift charts, volume per muscle, bodyweight
- **Honest coach.** A rules engine decides what's allowed; your own Claude (via MCP) proposes changes you accept or reject
- **Safety first.** Pain flags run through fixed safety rules that no AI can soften

Not medical advice.

## Repo

| Path                 | What                                                     |
| -------------------- | -------------------------------------------------------- |
| `CLAUDE.md`          | Project constitution: scope, hard lines, stack, phases   |
| `design/canvas/`     | Claude Design source (read-only visual spec)             |
| `docs/`              | `DESIGN.md`, phase plans in `plans/`, `CHANGELOG.md`     |
| `vpt/`               | Evidence dataset v0.1.1 (read-only; see `vpt/README.md`) |
| `packages/`, `apps/` | Workspaces, created as each phase starts                 |

## Storybook

The design library, every screen in both themes: https://tare-storybook.onrender.com

## Develop

Node 24 (`nvm use`), npm workspaces.

```bash
npm install
npm run lint
npm run typecheck
npm test
```

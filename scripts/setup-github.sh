#!/usr/bin/env bash
# One-off (idempotent) setup of Tare's GitHub task tracking: labels, milestones, project board.
# Needs: gh CLI, logged in with project scope →  gh auth refresh -s project
set -euo pipefail

REPO="${REPO:-waq-b/tare}"
OWNER="${REPO%%/*}"

echo "→ Labels"
label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; echo "  $1"; }
label "type:planning" "784bd1" "Planning task"
label "type:build"    "579bfc" "Build task"
label "type:docs"     "ffcb00" "Docs task"
label "type:test"     "cab641" "Test task"
label "type:data"     "fdab3d" "Data problem or request for the data session (vpt/)"
label "decision"      "0e8a16" "Open question needing a decision"
label "waiting:waqar" "bb3354" "Waiting on Waqar"
label "waiting:data"  "ff642e" "Waiting on the data session"
label "blocked"       "df2f4a" "Blocked"
label "later"         "c4c4c4" "Out of current scope; don't build yet"

echo "→ Milestones"
milestone() {
  if gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title' | grep -Fxq "$1"; then
    echo "  $1 (exists)"
  else
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null; echo "  $1"
  fi
}
milestone "S0 — Repo setup"          "git, workspaces, CI, housekeeping, task tracking"
milestone "D0 — Tokens + DESIGN.md"  "Design tokens, icons, DESIGN.md inventory"
milestone "D1 — Storybook library"   "Every component and every canvas screen as a story"
milestone "P0 — Logging app"         "PWA logging, offline + sync, onboarding, safety screens"
milestone "P1 — Rules engine"        "Progression, volume, stall, deload, safety engine"
milestone "P2 — AI coach via MCP"    "MCP server, validator, weekly review, push"
milestone "P3 — Cardio"              "Rides: minutes + effort"
milestone "P4 — Food"                "Nutracheck + Claude via MCP; Food screens wired"

echo "→ Project board"
PROJECT_NUM=$(gh project list --owner "$OWNER" --format json --jq '.projects[] | select(.title=="Tare") | .number' || true)
if [ -z "$PROJECT_NUM" ]; then
  PROJECT_NUM=$(gh project create --owner "$OWNER" --title "Tare" --format json --jq '.number')
  echo "  created project #$PROJECT_NUM"
else
  echo "  project #$PROJECT_NUM (exists)"
fi
gh project link "$PROJECT_NUM" --owner "$OWNER" --repo "$REPO" >/dev/null 2>&1 || true

echo "Done. Board: https://github.com/users/$OWNER/projects/$PROJECT_NUM"
echo "Tip: in the board UI, group by Milestone and turn on the 'Item added → Todo' and 'Closed → Done' workflows."

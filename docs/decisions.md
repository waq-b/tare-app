# Decisions log

Decisions Waqar has made. Newest first. When a `decision` issue is answered, add it here and close the issue. Each line gives the decision and why, briefly.

## 2026-09-22 — light-theme chip text (#24)

- **Darken chip text, not the fills.** Each semantic colour gets an on-tint text token (`--<c>-on-tint`) with the same hue, tuned to pass 4.5:1 on its tint over both the page (`bg`) and a card (`surface-1`). Light values: progress `#1A7142`, swap `#0E6A86`, warning `#8B5700`, safety-stop `#B9271E`. Hold and deload were close (4.91 and 4.92) but pass, so they keep their base colour, as do accent and every dark value. Tint fills are unchanged. The contrast test covers both backgrounds, in both themes. _Why:_ light chips on the page background were 4.08–4.39:1, and changing the palette or making tints opaque would have changed how everything looks

## 2026-09-22 — D0 signed off

- **D0 signed off** (#17): tokens, icons, DESIGN.md and gallery accepted. Before D1: run the vpt v0.1.2 upgrade routine (#19) and apply the contrast decisions (#18)

## 2026-09-22 — answers to the D0 outstanding questions

Made in the planning chat, outside Claude Code. The numbers match Claude Code's question list at the end of D0.

**Still open** (at the time)

- **D0 sign-off:** answered above (#17)

**Onboarding and safety (P0; design fixes land in D1)**

1. **Health screen:** use the 5 screening questions from `vpt` (`sf.screening`) word for word. Redraw the screen in D1 around them
2. **Result screens:** one screen per screening result. Don't invent wording for results that have no message. The wording is requested from the data session (v0.1.2)
3. **GP-first result:** stops setup; the only way on is "Change my answers". **Plus** an "I've spoken to my GP, carry on" option, so it isn't a dead end. The data session is adding a `cleared_by_gp` path
4. **Pain-flag sheet:** do a short design pass in D1 that adds follow-up questions driven by the rules (how long, swelling, numbness, settling, "not sure"), plus a calf area. Illness, urine, cycle and energy flags go in a separate check-in flow later
5. **Body areas:** P0 records the flagged area but doesn't drop exercises automatically until the data session delivers `body_areas` and the area → exercises map (v0.1.2)
6. **Health answers:** sync them to Supabase, and change the copy to be honest about that (not "stays on your phone"). The P2 validator needs flagged areas server-side
7. **Safety follow-up notifications:** always on. Show them locked in settings

**Logging and data (P0)**

8. **Exercise names:** use the full `name` until the data session adds `display_name` (v0.1.2)
9. **Warm-up sets:** you can add them by hand in P0. Always excluded from progression, volume and charts. A warm-up rule is requested from the data session
10. **Weigh-ins:** any frequency; charts show a 7-day average
11. **Estimated 1RM:** Epley formula, only from sets of **10** reps or fewer (was 12; v0.1.2 `tr.global.e1rm` follows Reynolds 2006, and the data wins). Labelled "estimated" and as our own calculation. Also logged as a data issue
12. **Effort → RPE mapping:** not needed until P1. Requested from the data session (v0.1.2)

**Look and feel (D1)**

13. **Contrast:** avoid grey tertiary text on the darkest card fill; darken the light-theme progress green to pass 4.5:1; label the light-theme chart colours directly on the chart
14. **Touch targets:** 48px minimum, confirmed
15. **Focus and Dial workout designs:** one docs page each, linking to the canvas board. Build nothing

**Data session**

16. **Data issues:** approved to pass on. The data session delivered **vpt v0.1.2** the same day: 17 of 19 resolved, #13 already decided, #18 deferred to P4. Status lines are in `docs/data-issues.md`

## 2026-09-22 — after vpt v0.1.2 (the data wins where it differs from the design)

- **Swap starting load:** use `tr.global.swap_starting_load`. 70 kg barbell bench → 24–25 kg dumbbells per hand, not the canvas's 26 kg
- **Muscle groups:** "Front delts" can't be shown separately; the data only has `shoulders`. Group credit is the **max** of member muscles, not the sum (`tr.global.muscle_group_rollup`)
- **Push/pull balance:** show it only as a gentle nudge that says it has no evidence behind a ratio. Waqar can drop it later
- **Mid-session pain:** `pain_during_exercise` → skip moves loading that area, with the ladder escalating to 111 / rest / GP. Label the "sharp" and ">5/10" thresholds as physio practice, not NHS guidance
- **Services:** show 111 per UK nation (NI → GP out of hours). The GP finder and physio self-referral links are England-only; say so
- **Non-staple exercises:** body areas, kit and skill tags are guesses. Prefer staples in plans and swaps

## 2026-09-22 — process

- **Task tracking** moved from monday.com to GitHub Issues + Projects (see CLAUDE.md §6); monday's free plan blocked API access
- **Design system first:** D0 tokens → D1 Storybook of every screen before any features. Food and notification screens are built as stories now and wired in their own phases
- **Stack:** TypeScript + React

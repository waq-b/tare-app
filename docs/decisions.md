# Decisions log

Decisions Waqar has made. Newest first. When a `decision` issue is answered, add it here and close the issue. Each line gives the decision and why, briefly.

## 2026-09-23 — P1 decisions (yes to all)

- **What changes by itself** (#87): load increases by the rules apply by themselves, always shown (chip and why) and undoable in one tap; stall resets, deloads and extra sets are offered and wait for accept or keep
- **Smallest jumps** (#88): the gym has 1.25 kg plates, so barbell lifts move in 2.5 kg steps (one plate a side). Dumbbells 2 kg per hand and machines/cables 5 kg as defaults; all changeable in Settings, with a per-exercise override
- **Untapped effort** (#89): a set with no effort tapped counts as OK; only a Hard tap holds the weight
- **When P1 ships** (#90): built now while Waqar logs his two P0 weeks; shipped to the phone when they end
- **Claude's first block** (#91): stays as P2's first task

## 2026-09-23 — After the first run on the phone

- **Starting weights are optional** (changes #69): onboarding ends on a "Your plan" screen that shows what the answers built and why (sessions, sets per week against the target band, the rules). Starting weights are tucked under "Starting weights · optional"; blank means an easy first set finds the weight
- **Weights from body stats** (height, weight, age, sex): yes, as a conservative, changeable recommendation. The data session adds a sourced starting-load rule (data issue 20, #75); the app side is P1 T12 (#92). Onboarding asks for body stats once that rule is in

## 2026-09-23 — Render addresses for now (changes #67)

- Render's custom-domain allowance is used up, so Tare stays on Render's own addresses for now: the app at `https://tare-web.example.com`, the API at `https://tare-api.example.com`. `tare.example.com` comes later
- When it moves, the phone's local data doesn't follow the new address; sync restores it after signing in. Check sync is healthy before switching
- Sign-in emails go through Resend from `tare@mail.example.com` (a separate API key from pip's), because Supabase needs custom SMTP to edit the email template

## 2026-09-23 — P0 decisions

- **Supabase** (#66): create a free project "tare" in London (EU). Daily use keeps a free project from pausing
- **Web address** (#67): `tare.example.com` (web) and `api.tare.example.com` (API) from day one, via Cloudflare CNAMEs, because the phone's data is tied to the address
- **Sign-in** (#68): email code sign-in **like pip**, on first launch, then remembered offline. Supabase Auth OTP, an **8-digit code** typed into the app (so the session lands in the installed PWA, not the browser), with the email's magic link as a desktop fallback. The code is checked once, automatically, when complete; pasted text is stripped to digits. Sign-ups off (`shouldCreateUser: false`) with accounts from an allowlist, and no account enumeration. The API verifies Supabase JWTs with `jose` against the JWKS. Pip's pattern: `apps/web/src/lib/auth-client.ts`, `screens/sign-in.tsx`, `apps/api/src/auth/jwt.ts` in the pip repo
- **Plan and starting weights** (#69): seed the D1 plan structure; a starting-weights step, blank = an easy calibration set
- **Weights before P1** (#70): no automatic progression in P0; the Ledger prefills the last working weight
- **Engine subset in P0** (#71): `packages/engine` with only what P0 needs; P1 extends it

## 2026-09-23 — D1 done

- **D1 signed off** (#50), after the layout fixes: the Storybook design library at https://tare-storybook.onrender.com. Polish stays in `later` issues #45–#49. P0 planning starts

## 2026-09-22 — D1 signed off

- **D1 plan signed off** (`docs/plans/D1.md`, #25–#41)
- **CLAUDE.md updated to vpt v0.1.2** (#42): §4 layout and §9 heading; `packages/data` added to the layout; §9 notes swaps filter by `equipment_detail` and `skill_tags`
- **Storybook hosting** (#43): a public Render static site, with fictional fixtures only and `noindex`. _Why:_ simplest and free; nothing personal is in it
- **Pain-flag sheet and BodyMap** (#44): the builder designs them in Storybook from existing components, in the canvas style, and Waqar reviews the stories. _Why:_ doesn't block T13 on the design session

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

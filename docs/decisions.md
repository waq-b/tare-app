# Decisions log

Design and engineering decisions, newest first, each with the reason in brief.

## Progression and the rules engine

- **What changes by itself.** Load increases from the progression rules apply automatically, always shown as a chip with the rule behind it, and can be undone in one tap. Stall resets, deloads and extra sets are only offered; they wait for accept or keep.
- **Smallest jumps.** Barbell lifts move in 2.5 kg steps (one 1.25 kg plate a side), dumbbells 2 kg per hand, machines and cables 5 kg. All are defaults, changeable in Settings with a per-exercise override.
- **Untapped effort counts as OK.** Only an explicit Hard tap holds the weight. Logging stays fast, and silence never blocks progress.
- **Starting weights are optional.** Onboarding ends on a "Your plan" screen showing what the answers built and why. Blank starting weights mean an easy first set finds the load. When body stats are given, a conservative, changeable estimate comes from `tr.global.starting_load`.
- **Estimated 1RM** uses Epley, only from sets of 10 reps or fewer (following `tr.global.e1rm`), and is labelled as an estimate.
- **No hard-coded evidence copy.** Where the dataset and the design disagree, the dataset wins: swap starting loads come from `tr.global.swap_starting_load`, muscle-group credit is the max of member muscles (`tr.global.muscle_group_rollup`), and the push/pull balance is shown only as a gentle nudge that says no evidence backs a ratio.

## Safety

- **Screening wording is the dataset's.** The five onboarding questions come from `sf.screening` word for word, one result screen per outcome, with no invented wording.
- **GP-first is not a dead end.** It stops setup, but offers "I've spoken to my GP, carry on" (the `cleared_by_gp` path) alongside "Change my answers".
- **Mid-session pain** follows `pain_during_exercise`: skip moves that load the area, with the ladder escalating to NHS 111, rest, or the GP. The "sharp" and ">5/10" thresholds are labelled as physio practice, not NHS guidance.
- **Services are per UK nation.** 111 is shown by nation (Northern Ireland: GP out of hours). The GP finder and physio self-referral links are England-only, and the app says so.
- **Health answers sync to the server**, and the copy says so honestly instead of claiming they never leave the phone. The planned AI validator needs flagged areas server-side.
- **Safety follow-up notifications are always on**, shown locked in settings.
- **Not medical advice** is stated at onboarding.

## Data and sync

- **Offline-first.** Every write goes to IndexedDB first; sync runs in the background and logging never waits for it. Records have client-generated UUIDv7 IDs, `updatedAt` and soft deletes.
- **Sign-in** is an 8-digit email code typed into the app (so the session lands in the installed PWA rather than the browser), with the email's magic link as a desktop fallback. Sign-ups are off, accounts come from an allowlist, and responses do not reveal whether an account exists. The API verifies Supabase JWTs with `jose` against the JWKS.
- **Weights before progression.** The first release logged with no automatic progression; the log prefilled the last working weight. Progression shipped afterwards.
- **Warm-up sets** can be added by hand and are always excluded from progression, volume and charts.
- **Weigh-ins** can be at any frequency; charts show a 7-day average.
- **Exercise names** use the dataset's short `display_name` for staples and fall back to the full name.
- **The web app's address matters.** The phone's local data is tied to the origin, so moving to a new domain means syncing first and restoring after sign-in.

## Design system

- **Design system first.** Tokens, then a Storybook of every screen, before any feature work. Stories use fictional fixtures only and the hosted Storybook is `noindex`.
- **Light-theme chip text.** The text is darkened, not the fills: each semantic colour gets an on-tint text token tuned to pass 4.5:1 on its tint over both the page and a card, in both themes.
- **Contrast and touch.** Avoid grey tertiary text on the darkest card fill, darken the light-theme progress green to pass 4.5:1, label light-theme chart colours directly, and keep touch targets at 48px minimum.
- **Stack:** TypeScript and React.

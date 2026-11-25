# Koi MVP design (approved 2026-11-25)

Status: **approved by the owner**. Next step: invoke superpowers:writing-plans, then build.

## Intent
Koi (ก้อย) is a standalone, place-first dating app for Bangkok, in Thai and English.
Promise: "Match into a real plan, at a safe place, and never get ghosted."
Specs in this folder: `pinky-template-2026-11-25/` (PINKY-TEMPLATE.md = spec,
pinky-core.ts = pure rules, schema.sql = starting Postgres schema) and
`koi-logo/` (brand SVGs). The longer product brief is
`~/jurgun/exports/koi-app-prompt.md` (read-only reference; do not modify the jurgun repo).

## MVP scope
Sign-up and profile, place pins on a venue map, open hours, private mutual
"hook a pinky" matching that unlocks into a plan with a place and a time, plan
chat (6-message limit until the plan has a place and a time), and the
ghost-free close. Also in: the cap of 3 open (`canTap`), report and block, and
the end flows (step back, back to friends, end kindly, dating off).

Out of the MVP: hosted tables, date ideas, rain plan, showed-up trust,
home-safe check, safe-venue programme, wingmate, memory map, money.

## Goals / non-goals / anti-goals
- Goal: every privacy invariant in PINKY-TEMPLATE.md §3 holds, each with its own test.
- Non-goal: swiping, feeds, ratings, live location, "nearby".
- Anti-goal: anything that lets one person infer the other's private taps, pins,
  open hours or close answer, even by timing.

## Decisions (owner-approved)
1. **"We met" context for the MVP = Browse**: a daily set of up to 10 profiles,
   no swiping, one deliberate "Hook a pinky" button per profile.
2. **Browse picks profiles by area only, never by pins** (using pins would leak
   them, invariant 15). This deviates from the wording in koi-app-prompt.md C3.2.
3. **Notification ban = union of both specs**: text must never match
   `/\b(date|dating|match|koi|pinky|romance)\b/i`.
4. `schema.sql` is extended with the tables it assumes or lacks: accounts, blocks,
   reports, chat_messages, profiles, dating_settings, consents, notifications,
   Browse daily sets.

## Stack (my calls, owner approved)
TypeScript; Next.js App Router as an installable PWA; Postgres with plain SQL
migrations started from schema.sql and Kysely for typed queries; `pinky-core.ts`
copied in unchanged as the rules layer; MapLibre GL with OpenStreetMap tiles;
next-intl (Thai and English, Noto Sans Thai); email one-time-code sign-up first,
phone OTP behind the same adapter later; a small scheduled sweep for close
deadlines and retention (the close outcome is also computed on read); Vitest
against a real Postgres plus Playwright at 375px in Thai and English; hosting
decided later, local first. Time zone Asia/Bangkok (UTC+7).

## Approaches considered
- Browse vs hosted tables vs both for the MVP context: Browse chosen (tables need
  real events and partner venues to mean anything).
- Where the rules live: pure `pinky-core.ts` called from a thin service layer, so
  the privacy-critical logic is testable without a server.

## Plan (tests first at every step)
1. Foundation: scaffold, brand tokens and logos, migrations, Bangkok time, i18n shell.
2. Sign-up and profile: 18+ age gate, consent before any dating data is saved, dating on/off.
3. Venues, map and pins: curated seed venues, coarse counts, at most 5 pins.
4. Open hours: weekly grid and the single proposed time.
5. Browse and Hook a pinky: area-based set, none/mine/mutual, cap of 3, silent
   unlock in one transaction with a pre-filled proposal (no confirms).
6. Plan space and chat: 404 for outsiders, edits clear both confirms, at most one
   unread plan notice, pre-plan limit with "A few more questions", report and block.
7. Ways out: step back, back to friends, end kindly, ended marker, dating off,
   delete or hold chat on ending.
8. Ghost-free close: "See them again?", identical timing for "no" and "no answer",
   second plan on both yes.

## Privacy tests
Each invariant (§3) has its own named test. Invariants 1-10 and 12-16 are real
tests in the MVP (byte-identical tap responses, no person location or count under
5 on any map response, 404 for outsiders, and so on). Admin separation is enforced
with Postgres permissions: the admin role has no grant on the dating tables.
Invariants 11, 17, 18 and 19 cover features outside the MVP, so they get guard tests
now (for example "no score field in any response", "no wingmate endpoint exists")
and become full tests when those features land.

## Left to the builder
Exact table and column names for the added tables, UI layout, seed venue list,
the Browse ordering within a day (must not depend on the other person's taps),
and the retention sweep schedule.

---

# POST-MVP PHASE: the four game-theory features (added 2026-11-25)

**Not part of the approved MVP.** Nothing above this line changed. This section
records the new spec sections (`pinky-template-2026-11-25/PINKY-TEMPLATE.md`
§10.13-10.18, with matching code in `pinky-core.ts` and tables in `schema.sql`)
so they get built later, in this order, once the MVP is done. Review result: none
of them moves into the MVP (reasons below).

New settings (`THEORY_SETTINGS` in `pinky-core.ts`): `tableMin/tableMax` 4-6,
`swapCap` 2000, `helloOpenHours` 36, `helloMax` 80, `reliableLast` 4,
`exploreDates` 3, `freshEvery` 4.

## P1. Fair tables, stable matching (§10.13)
Checked-in people at a hosted table event are split into tables of 4-6 so that no
two people at different tables would both be happier swapping (`exchangeStableTables`:
greedy seed, then improving swaps up to the cap; reports any blocking swaps left).
Happiness counts shared interests, shared languages and an "anchor" only. **Never
gender, pins or open hours.** The rule is published on the event page; the host can
move people. Optional: Irving's stable roommates for one-to-one pairings.
Tables: `table_events`, `table_seats`.
Depends on: hosted tables (admin events, bookings, check-in), which the MVP skips.

## P2. Say hi first, costly signalling (§10.14)
One line of up to 80 characters per person per table, open from 36 h before the
table until it ends, shown only to that table's people, deleted 7 days after.
Table: `hellos`. Depends on P1's table events.
Before building: free text from strangers needs report and moderation handling, and
`hellos` must go on the admin deny list unless a line is reported.

## P3. Showing up pays, tit-for-tat (§10.15)
`reliable()` = turned up to the last 4 plans or tables, or a host or date privately
said "again". Reliable people get first call on freed seats (`waitlistOrder`:
priority, then reliable, then first come) and their row is offered a little more
often. Never displayed, no badge, fades. Tables: `again_marks`, `table_waitlist`.
Depends on: showed-up trust (§10.9, `show_ups`), which the MVP skips, and on tables.
**Open tension to resolve first:** `again_marks` stores a one-sided "yes" about
another person. The doc says it is never shown, but it does change that person's
visibility. Invariants 3 and 16 are written for taps and close answers; decide
explicitly whether this is allowed, and add `again_marks` to the staff-never-see list.

## P4. Explore, then lean in, optimal stopping (§10.16)
`ideaMode(datesHad, weekNumber)` gives explore (first 3 dates), then lean, with one
"fresh" week in every 4. `favouredKinds` feeds `dayIdeas`. Reads only the person's
own history (`tried_kinds`, derived from their private close answers). Never shown,
never changes what the other person sees. Depends on: date ideas (§7), which the
MVP skips.

## P5. The theory table (§10.18)
Documentation only: every rule is mapped to its principle. Copy it into the project
README. No code.

## Tests for this phase (from the new §11 checklist)
- Fair tables: after the search, no two people at different tables would both
  prefer to swap, and any left are reported; no table is outside 4-6 when the
  headcount allows; gender is never an input.
- Say hi: shown only to that table's people, only in the open window, trimmed to
  80 characters, deleted 7 days after.
- Reliable people come before others for freed seats; the reliable flag is in no
  response.
- Ideas vary for the first 3 dates, lean toward kinds with a mutual yes after, and
  keep one new pick every 4 weeks.

## Keeping the MVP compatible (no scope change)
- The MVP stores each plan's venue key, so a plan's date kind can be derived later.
- The MVP close stores answers in `pinky_closes` as the template defines, so P3 and
  P4 can read them later.
- Later migrations add the new tables. The MVP does not create them.
- The MVP's admin deny-list test covers table names by pattern, so `hellos` and
  `again_marks` are denied the day they appear.

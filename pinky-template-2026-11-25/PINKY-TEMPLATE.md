# Pinky: a portable template for mutual-interest dating

Pinky (เกี่ยวก้อย, "hook pinkies") lets two people who already met as friends
tell each other they'd like to try a date. Each person's interest stays
completely private unless both of them choose it. This template takes
Pinky's rules, data model and features out of Jurrgun so another dating app
can rebuild them.

Sections 1–9 are Pinky as it runs in Jurrgun today. Section 10 adds the
**place-first** features for a map-based app. Their positioning line is
*"Match into a real plan, at a safe place, and never get ghosted."* These
features are proposals and haven't run in production yet.

It contains three files:

| File | What it is |
| --- | --- |
| `PINKY-TEMPLATE.md` | This spec: the settings to fill in, the rules, the flows, the copy and the tests |
| `pinky-core.ts` | The pure rules in TypeScript with no framework or database code, ready to copy |
| `schema.sql` | Generic Postgres tables |

Anything in `{{double braces}}` is a setting for your app to fill in. The
value next to it is what Jurrgun uses.

---

## 1. The idea in one paragraph

Two people share a **context**, such as a meetup table or an activity
partnership. Either person can quietly **tap**. A tap is never shown,
counted or hinted at to the other person. If both tap, and every
compatibility rule holds when checked silently at that moment, the pair
**unlocks**. Both then get the same neutral notification and a private
**space** for planning one real date. Either person can **step back**
(silently), **go back to friends**, or **end kindly** at any time. Whoever
ends it, both people come out of it feeling the same, and nobody can tap
again to pressure the other.

## 2. Settings to fill in

| Setting | Jurrgun value | Meaning |
| --- | --- | --- |
| `{{CONTEXTS}}` | `table` (a checked-in event), `buddy` (an activity pairing) | Where two people can have "met" |
| `{{TAP_WINDOW}}` | 72 h after the event ends; buddy: while active + 7 days after it ends | How long taps are taken; a tap expires with its window |
| `{{CONTEXT_MIN}}` | table: both checked in; buddy: ≥ 2 activities finished together | What has to be true before the row shows |
| `{{ELIGIBLE}}` | `relationship = single AND dating_on` | The single test for "dating is on", used everywhere |
| `{{COMPATIBLE}}` | gender "open to" both ways + orientation filter both ways + women-only | Mutual preference check |
| `{{IDEAS_AT_A_TIME}}` / `{{IDEAS_PER_DAY}}` | 3 / 9 | Date ideas per batch, and the daily cap |
| `{{DAY_TZ}}` | Asia/Bangkok | Time zone for the start of "today" (when ideas reset) |
| `{{HOME_SAFE_LEAD}}` | 20 h | Show the "ask me if I got home safe" check only this close to the date |
| `{{NOTE_MAX}}` / `{{PLACE_MAX}}` | 280 / 80 characters | Limits for the shared note and the place name |
| `{{UNLOCK_NOTICE}}` | "Something nice is waiting in My people" | Neutral wording, so a lock screen never says "date" |
| `{{PLAN_NOTICE}}` | "Your plan was updated in My people" | Neutral wording, at most one unread at a time |
| `{{END_PRESETS}}` | thanks / friends / not_ready (see §9) | Preset goodbye messages; nothing free-typed |
| `{{WORLDS}}` | real vs demo accounts | Account pools that must never unlock together |

The place-first settings (§10) are new and have no Jurrgun value yet. The
values shown are suggested starting points.

| Setting | Suggested | Meaning |
| --- | --- | --- |
| `{{PINS_PER_PERSON}}` | 3–5 | Private first-date places each person pins |
| `{{COUNT_ROUND}}` / `{{COUNT_HIDE_BELOW}}` | 5 / 5, refreshed daily | Coarse counts on the map; below the threshold, show nothing |
| `{{REQUIRE_SHARED_PLACE}}` | false | true: a Pinky unlocks only with a shared pin. false: a shared pin only pre-fills the plan |
| `{{SLOT_MIN_HOURS}}` | 2 | The shortest shared free window that counts |
| `{{PROPOSE_LEAD}}` / `{{PROPOSE_HORIZON}}` | 24 h / 14 days | How far ahead a proposed time can be, at the earliest and the latest |
| `{{LOCAL_OFFSET_MIN}}` | +420 (UTC+7) | The local time zone for open hours. Zones with daylight saving need a time-zone library |
| `{{PRE_PLAN_MESSAGES}}` | 6 per person, plus 6 once via "A few more questions" | The chat limit until a plan has a place and a time |
| `{{RAIN_THRESHOLD}}` | 60 % | Forecast chance of rain at which the indoor backup is offered |
| `{{MAX_OPEN}}` | 3 | Open Pinkies plus outstanding taps, per person |
| `{{CLOSE_ASK_AT}}` / `{{CLOSE_WINDOW}}` | 10:00 the next morning / 48 h | When "See them again?" is asked, and how long answers stay open |
| `{{NO_SHOW_LIMIT}}` | 2 people in 60 days | No-show reports from different people before visibility drops quietly |
| `{{HOME_SAFE_ESCALATE}}` | 60 min | With no reply to the home-safe check, the person's own trusted contact is told (opt-in) |
| `{{TABLE_SIZE}}` | 4–6 | People per hosted table (§10.13) |
| `{{SWAP_CAP}}` | 2,000 swaps | The most improving swaps the table search tries before stopping (§10.13) |
| `{{HELLO_OPEN}}` / `{{HELLO_MAX}}` | 36 h before the table / 80 characters | When "Say hi first" opens, and how long a line can be (§10.14) |
| `{{RELIABLE_LAST}}` | 4 | Turning up to this many plans or tables in a row earns "showing up pays" (§10.15) |
| `{{EXPLORE_DATES}}` / `{{FRESH_EVERY}}` | 3 / 4 | First dates spent exploring, and how often one idea is kept for something new (§10.16) |

## 3. Privacy invariants (non-negotiable)

These are what make Pinky safe. Build tests for every one of them (§10).

1. **The row never depends on the other person.** Whether the Pinky row
   shows depends only on the viewer (dating on), the shared context, the
   window, and blocks. It never depends on whether the other person is
   single, has dating on, or is open to the viewer, so its presence leaks
   nothing.
2. **Every tap gets the same answer.** "Your pinky is out" shows whatever the
   other person's status, until the pair is mutual.
3. **A one-sided tap is invisible.** It is never returned to the other
   person, never counted, never logged, and never used in a ranking.
4. **Rules about the other person run only at unlock, silently.** If any
   rule fails, nothing visible changes for either person.
5. **Staff never see it.** There is no admin view and no audit-log entry for
   taps, Pinkies, plans or ideas.
6. **Stepping back tells nobody.** The tap is deleted, not turned into some
   other choice the person never made.
7. **No re-tap after an ending.** After "Back to friends" or "End kindly", an
   *ended* marker blocks new taps for that pair in that context, for good.
8. **Turning dating off ends everything silently.** It withdraws every tap
   and turns every Pinky back to friends.
9. **Separate worlds never unlock together**, for example demo or test
   accounts and real accounts.
10. **Neutral notifications.** No notification text ever contains "date",
    "Pinky" or "romance".
11. **Ideas never explain themselves.** There's never "because you both like
    X", and the mix is chosen so neither person can work out the other's
    private answers (§7).
12. **Ending deletes.** Ending a Pinky deletes the Pinky, its plan, its idea
    counter and the chat from the Pinky period. The one exception is an open
    report between the two (§8).
13. **No autopilot.** No streaks, no date counters, no countdowns and no
    teaser before the row is offered.

The place-first features (§10) add six more:

14. **People are never on the map.** Only curated public venues appear.
    Counts are coarse, rounded, refreshed daily, hidden below a threshold,
    and never "here now". The app never shows live location or dots for
    people, and doesn't allow free-drop pins.
15. **Pins are private.** A pin is used only inside the silent unlock check.
    After a mutual unlock, the pair sees only the places they **both**
    pinned, never the rest. This is the one deliberate exception to rule
    11: a shared place is the point of the app, and it's shown only once
    the pair is mutual.
16. **A one-sided "yes" is never shown.** For "See them again?", "no" and
    "no answer" look exactly the same to the other person, including the
    timing (§10.5).
17. **No public scores.** The showed-up signal only quietly lowers
    visibility, fades over time, and is never displayed to anyone.
18. **Wingmates never see your dating.** A wingmate never sees who you tap,
    match, plan with or talk to.
19. **Venues never learn who's dating.** Partner venues get only rounded,
    delayed totals, never names or times.

## 4. States

```
            (row offered: viewer eligible + shared context + window open + no block + not ended)
 none ──tap──▶ mine ──(other taps & silent rules pass)──▶ MUTUAL (Pinky: active)
  ▲             │                                           │   │
  └─step back───┘ (silent, tap deleted)                     │   ├─pause──▶ paused ─resume (pauser only)─▶ active
                                                            │   │
            Back to friends / End kindly / dating off / block ──▶ friends + ENDED marker (no re-tap)
                                                                   (held instead of deleted while a report is open)
```

What the viewer can see is only `none`, `mine` or `mutual`. There is no state
that means "they tapped".

## 5. Data model

There are two layers. Full DDL is in `schema.sql`.

**Layer 1: taps and connections.** These reuse a generic "choices" table and
a "connections" table.

- `connection_choices(context_key, from_account, to_account, choice)`
  - `choice = 'romance'` is a tap.
  - `context_key` is the event id, or `buddy:<matchId>`.
  - The ended marker is a row with `context_key = 'pinky-ended:<key>'` and
    `choice = 'none'`.
  - Unique on `(context_key, from_account, to_account)`.
- `connections(a_account < b_account, context_key, level)`
  - `level = 'romance'` means mutual.
  - Going back to friends sets `level` to `friend` (or to whatever level the
    context had before, such as `activity` for a buddy).

**Layer 2: Pinky Plans.**

- `pinkies`
  - Columns: `a_account`, `b_account`, `source`, `source_key`,
    `connection_id` (unique), `state` (active / paused / held),
    `paused_by`, `ended_at`.
  - It always changes in the **same transaction** as its connection.
    Starting it goes with the move to `romance`, and ending it goes with the
    move off `romance`. The two must never drift apart.
- `pinky_plans`
  - Columns: `pinky_id` (unique), `place_name`, `idea_key`, `area`,
    `starts_at`, `note`, `a_confirmed_at`, `b_confirmed_at`.
  - Each Pinky has one plan, which gets overwritten (there is no history).
- `pinky_idea_views(pinky_id, day)`, unique, with a `shown` counter that
  caps at `{{IDEAS_PER_DAY}} / {{IDEAS_AT_A_TIME}} - 1`.

Always store pairs ordered (`a < b`), but match in both orders when
counting, so a query never relies on the ordering.

## 6. Algorithms

Pseudocode. The pure parts are implemented in `pinky-core.ts`.

**Offer: does the row show for me on this person?**
```
offered(me, ctx) =
  ctx.met && !ctx.blocked && !ctx.ended && ELIGIBLE(me)
  && (ctx.mutual || ctx.windowOpen [&& CONTEXT_MIN])
```
A mutual Pinky keeps showing after the window closes.

**Tap**
```
if !offered or !windowOpen or mutual: return            # same response either way
upsert choice(key, me→them, 'romance')
theirs = choice(key, them→me)
if !sameWorld(me, them): return
if unlocked(taps=[true, theirs=='romance'], ELIGIBLE(me), ELIGIBLE(them),
            COMPATIBLE(me, them), !blocked, contextOK):
  in ONE transaction:
    upsert connection(level='romance')
    insert pinky(state='active')
    notify(me, UNLOCK_NOTICE); notify(them, UNLOCK_NOTICE)
```
The handler returns the same page and status for every outcome.

**Step back**
```
if mutual:  -> Back to friends (below)
elif my tap: delete my tap                              # tells nobody
```

**Back to friends** (silent) and **End kindly** (sends one preset message). Both do this in one transaction:
```
delete both taps (this key)
insert ENDED marker (this key)
end pinky -> see "End" below
connection.level = previous level ('friend' / 'activity')
```
End kindly then posts the chosen `{{END_PRESETS}}` message in their ordinary
chat, timestamped just after the Pinky's end, so it survives the deletion,
along with the usual neutral "New message" notification.

**End (delete or hold)**
```
if open report between the two (either direction):
    pinky.state = 'held', pinky.ended_at = now          # chat waits for review
else:
    delete chat messages in the Pinky period (created_at..ended_at, both senders,
           all their threads) EXCEPT messages that have their own report
    delete pinky
always: delete plan, delete idea views
retention job: held pinkies whose reports are all closed -> delete period chat, then the row
```

**Dating switched off.** End every Pinky I'm in, delete every tap I made,
and set every romance connection I'm in back to `friend`. All of it happens
silently.

**Block.** End every Pinky between the two, withdraw both taps in every
context, and keep the block. The block control in the space is neutral,
sits next to Report, and takes one confirm step.

## 7. Date ideas: private-preference ranking

Inputs: each person's own first-date preferences, which they already gave
when they turned dating on. Nothing new is asked.

```
shared = intersection(a.firstDateKinds, b.firstDateKinds)   # only the overlap is used
seed   = pinkyId + ":" + today(DAY_TZ)                       # same pair + day → same ideas
pool   = shuffle(ALL_IDEAS, rng(seed))
liked  = pool where kind ∈ shared;  other = pool where kind ∉ shared
repeat in batches of IDEAS_AT_A_TIME until IDEAS_PER_DAY:
    batch = [one from `other`]                        # at least one non-preference idea, always
    fill with `liked` while liked-in-batch < IDEAS_AT_A_TIME-1, else `other`
    shuffle(batch)
```

Why this mix:
- Every batch includes at least one idea that isn't preference-driven.
- No batch is ever all-liked.
- The order within a batch is shuffled.
- No reason is shown.

Together, these mean neither person can work out the other's private
answers. The "Other ideas" button moves to the next batch and stops at the
daily cap. Never show a counter.

Each idea carries `key`, `kind`, `area`, `place`, `when` and `why`, in each
language.

## 8. The private space (Pinky Plans)

Only the two people can open it. Anyone else gets a 404, not a 403. The
accent colour appears only at the unlock moment, never inside the space.

| Feature | Rules |
| --- | --- |
| **Plan** (place + time) | Either person can set it. Changing the place or time clears **both** confirms. |
| **Confirm** | Each person confirms the plan as it stands. When both have confirmed, show "✓ Both confirmed". |
| **Plan notice** | When one person changes or confirms the plan, the other gets `{{PLAN_NOTICE}}`. It waits for quiet hours, and at most one is unread at a time. Note edits are silent. |
| **Shared note** | One note for both. No history, no "edited by", no timestamps. Up to `{{NOTE_MAX}}` characters. |
| **Ideas** | §7. "Use this place" pre-fills the plan form. |
| **Past plan** | After the plan's time it reads "Last time: {place}, {date}" with one button, [Plan the next one]. No streaks and no counts. |
| **Home-safe check** | Opt-in "Ask me if I got home safe". Private to the person who sets it. Offered only within `{{HOME_SAFE_LEAD}}` of the date (a time-of-day check would otherwise fire on the wrong night). |
| **Share your plan** | Sends the where and when to a trusted contact. It is filled in on the user's own device, never by the server. |
| **Pause** | Either person can pause, and no reason is asked. Everything except End kindly and Resume waits while paused. Only the person who paused can resume. |
| **Ways out** | **Back to friends (no message is sent)** on the person's card, and **End kindly** (a preset message) in the space. Both are neutral buttons, not red. |
| **Safety** | Report and Block sit side by side, neutral. Block has one confirm step. A safety line shows at unlock: "First date? Meet somewhere public and tell someone you trust your plan." |

## 9. Copy (English; Jurrgun also ships Thai)

| Moment | Text |
| --- | --- |
| Row title | Pinky |
| Invitation (not mutual) | Hook pinkies to try a date. *(buddy: "Two quests done together. Hook pinkies to try a date.")* |
| Before tapping | Private. They only find out if you both do. *(buddy adds "Open until {date}.")* |
| Button | Hook pinkies |
| After tapping | **Your pinky is out.** If they hook theirs too, you'll both know. If not, they never find out. [Step back] · You can step back anytime. Nobody is told. |
| Mutual | **You and {name} both hooked pinkies.** You chose each other. Now go somewhere real. [Open our Pinky space] [Send a message] [Back to friends (no message is sent)] |
| Safety line | First date? Meet somewhere public and tell someone you trust your plan. · Share your plan · Date safely |
| After Back to friends | You're back to friends. Nobody did anything wrong. *(stays until closed, for that one visit)* |
| End kindly presets | "Thank you for the date. I hope you find the right person." · "I'd rather we were friends." · "I'm not ready right now. I'm sorry." |
| Unlock notification | Something nice is waiting in My people |
| Plan notification | Your plan was updated in My people |

## 10. Place-first features (for a map-based app)

These build on §1–9. The new rules are in `pinky-core.ts` (section
"place-first") and the new tables are in `schema.sql` (section "Place-first
features").

### 10.1 Place pins and the map
- **Pins come from a venue list.** Each person pins `{{PINS_PER_PERSON}}`
  places where they'd happily have a first date. Pins can only be venues from
  your curated list, which holds public places such as cafés, parks and
  markets. Nobody can drop a pin at a home address.
- **The map shows venues, never people.** Each venue shows its kind, its
  area, whether it's a safe first-date venue (§10.7), and a coarse count:
  `coarseCount(n)` is n rounded down to 5, and nothing below 5. The wording
  is "A few people like this spot", never "12 people here now".
- **On unlock** (the Pinky rules in §6, unchanged), the app proposes a
  plan:
  - The place is `sharedPlace`: one deterministic pick from the pins both
    people share, preferring safe venues.
  - The time is `nextSharedSlot` (§10.2).
  - The plan is pre-filled as a proposal with **no confirms**, so both
    people still confirm it.
  - If the pair shares no pin, fall back to date ideas (§7).
- **Shared-place setting.** With `{{REQUIRE_SHARED_PLACE}} = true`, a shared
  pin becomes one more silent unlock rule. That gives fewer matches, but
  every one of them already has a place.
- **The mutual screen** shows "You both pinned **{place}**. {Day}, {time}
  works for you both." Copy: *"Pick the place first. If they picked it too,
  you're halfway to a date."*

### 10.2 Open hours
- **Weekly free times.** Each person marks the times they're usually free
  each week, for example Sat 14–18 or Thu 19–22. These are never shown to
  anyone else.
- **Proposed time.** `nextSharedSlot(a, b, now)` returns the earliest
  shared window of at least `{{SLOT_MIN_HOURS}}`, between
  `{{PROPOSE_LEAD}}` and `{{PROPOSE_HORIZON}}` ahead.
- **Privacy.** Only the one proposed time is revealed, never either
  person's full week.

### 10.3 Plan first, then a short chat
- **Pre-plan limit.** Until the plan has both a place and a time, each
  person can send `{{PRE_PLAN_MESSAGES}}` messages. Once it has both, the
  chat opens fully. The plan doesn't need to be confirmed yet.
- **Safety exception.** Either person can tap **"A few more questions"**
  once per Pinky, which adds the allowance again for both of them. This
  exists because some people need to chat a little more before they feel
  safe meeting. Report and Block are never limited.
- **Why.** It stops the three-week pen-pal match.

### 10.4 Rain plan
- **Backups.** Every outdoor venue lists one nearby indoor backup.
- **The swap is offered, not forced.** When the forecast for the plan's
  time reaches `{{RAIN_THRESHOLD}}`, the space offers "Rain likely. Swap to
  {backup}?" as a one-tap swap.
- **A swap counts as a plan change.** It clears both confirms and sends the
  usual plan notice (§8). It's offered rather than automatic, so nobody
  turns up at the wrong place.

### 10.5 The ghost-free close
- **The question.** At `{{CLOSE_ASK_AT}}` after the plan's time, each person
  is asked privately: **"See them again?"** The answers are Yes, No, or "We
  didn't meet".
- **Both yes.** The second-date plan opens straight away: the plan resets
  and Pinky stays active. It's the only result that can happen early.
- **Anything else.** When either person says no, says "We didn't meet", or
  doesn't answer, the Pinky closes kindly (End kindly, §6). Both people get
  the same neutral line: *"This one's closed. Thank you both for showing
  up."* No message is sent in either person's name.
- **Same timing.** The person who says no sees it closed straight away, but
  the other person's side resolves only at the end of the
  `{{CLOSE_WINDOW}}`. That way "no" and "no answer" can't be told apart,
  not even by timing (invariant 16).
- **No ghosting.** Nobody is left wondering, and nobody has to write the
  hard message.

### 10.6 Three open at most
- **The cap.** `canTap` allows a new tap only while (open or paused
  Pinkies) + (my outstanding taps) < `{{MAX_OPEN}}`. When a tap unlocks, it
  turns into a Pinky, so the total never goes over the cap.
- **Privacy.** The cap depends only on the viewer, so it leaks nothing.
- **Copy.** "You have 3 plans open. Close one to hook a new pinky."

### 10.7 Safe first-date venues
- **What qualifies.** Partner venues agree to be public, staffed, near
  transport and open late, and to train their staff on a **code phrase**
  (like the UK's "Ask for Angela" scheme) that gets a guest discreet help.
- **On the map.** These venues carry a "Safe first-date venue" mark, and
  `sharedPlace` prefers them.
- **What venues learn.** A venue is never told that a booking is a date.
  Partners see only rounded, delayed totals (invariant 19).
- **How guests learn the phrase.** It's shown inside the Pinky space, not
  on the public map.

### 10.8 Arrival and home-safe
- **Two optional checks.** "I've arrived" and "Ask me if I got home safe"
  are both opt-in, and only the person who sets them sees them. They're
  offered from `{{HOME_SAFE_LEAD}}` before the date (§8).
- **Escalation.** With no reply after `{{HOME_SAFE_ESCALATE}}`, the
  person's **own** trusted contact is told, if they set one up. The date is
  never told.
- **Make it a headline feature.** "We'll check you got home. Only you see
  it."

### 10.9 Showed-up trust, without ratings
- **The answer.** At the close (§10.5), each person privately answers one
  more thing: they came / they didn't come / I couldn't make it.
- **Lowered visibility.** `noShowLimited` is true when
  `{{NO_SHOW_LIMIT}}` **different people** reported a no-show within the
  window. The person's row is then offered less often, quietly. The flag
  fades as reports age out of the window.
- **What doesn't count.** Cancelling at least `{{PROPOSE_LEAD}}` before the
  date never counts as a no-show.
- **What's never shown.** There are no stars, no scores, no reviews of
  people, and no "reported" badge.

### 10.10 Tables: low-pressure group meetups
- **The format.** Small hosted meetups (4–8 people, one public venue) are
  pinned on the map.
- **How Pinky fits.** These are the `table` context from §2: Pinky opens
  only after check-in, during the tap window. It's the lowest-pressure way
  in, and it's what Jurrgun runs today.

### 10.11 Wingmate
- **Who.** A trusted friend: someone already connected to you, who is
  invited and accepts.
- **Suggested pins.** A wingmate can suggest a pin. You accept or decline
  it, and nothing is pinned without you.
- **Vouches.** A wingmate can add one vouch from a short preset list, such
  as "Always on time" or "Great company on a long walk".
- **Who sees the vouch.** Only your Pinky partner, after a mutual unlock,
  as "A friend vouched: '…'". The friend's name isn't shown.
- **What wingmates see.** Wingmates never see your taps, matches, plans or
  chats (invariant 18).

### 10.12 Memory map
- **What you can keep.** After a date, you can choose to keep it on your
  private memory map. It stores only the **venue and the month**, never the
  other person.
- **Survives an ending.** The memory stays when the Pinky ends, because it
  holds nothing about the other person.
- **No counts.** There's no count, streak or "dates this month".
- **Sharing.** A couple can choose to share their memory maps with each
  other. Both have to say yes.

### 10.13 Fair tables (stable matching)
*Theory: market design. A clearinghouse that runs one central round with a
published rule, as medical residency matching does, beats first-come or
engagement-driven matching.*

- **The rule.** The checked-in people at a hosted table event are split
  into tables of `{{TABLE_SIZE}}` so the split is **exchange-stable**: no
  two people at different tables would both be happier if they swapped
  seats. This is the group version of "no blocking pair" in stable
  matching, and it's what makes seating feel fair rather than arbitrary.
- **How.** Start from a greedy split, then keep making swaps that make
  **both** people happier until none is left, or until `{{SWAP_CAP}}`.
  Exchange-stable splits don't always exist, so the search reports any
  swaps still left (`exchangeStableTables` in `pinky-core.ts`).
- **What happiness counts.** Shared interests, shared languages and an
  "anchor" (at least one person you have something in common with). It
  never counts gender, and never pins or open hours, which stay private to
  plans.
- **Published.** Say how tables are made, in plain words, on the event
  page. The host can still move people.
- **Pairs (optional).** For one-to-one activity pairings, use Irving's
  stable roommates algorithm on stated preferences. When no stable pairing
  exists, fall back to greedy pairs, then keep making swaps that help
  someone and hurt nobody (Pareto improvements).

### 10.14 Say hi first (costly signalling)
*Theory: costly signalling without money. A small effort shows real intent,
where a free signal would mean nothing.*

- **The line.** From `{{HELLO_OPEN}}` before a hosted table until it ends,
  each person can write one line of up to `{{HELLO_MAX}}` characters for
  one light prompt, for example "The dish you'd order for the table?"
- **Who sees it.** Only the people going to that table. It's deleted 7 days
  after the table.
- **No pressure.** Skipping is fine and nothing is scored. Walking in
  already knowing something about each person takes the edge off nerves and
  gives everyone a first topic.
- **The same idea elsewhere.** The three-open cap (§10.6) makes each tap
  scarce, so a tap is a signal rather than cheap talk.

### 10.15 Showing up pays (tit-for-tat)
*Theory: tit-for-tat in a repeated game. Reward cooperation, so that turning
up becomes the best long-run strategy, not only something the rules punish
you for skipping.*

- **Reward.** Someone who turned up to their last `{{RELIABLE_LAST}}` plans
  or tables, or whom a host or date privately wanted to see again, is
  **reliable**.
- **What reliable gets.** First call on freed seats at hosted tables, and
  their row is offered a little more often. This is the reward side of
  showed-up trust (§10.9), which only punishes no-shows.
- **Never shown.** Like the no-show signal, it's never displayed, never a
  badge, and fades if the streak breaks.
- **Waitlist order.** Priority (not lost to no-shows) first, then
  reliable, then first come, first served (`waitlistOrder`).

### 10.16 Explore, then lean in (optimal stopping)
*Theory: optimal stopping, the explore-then-exploit trade-off. Sample widely
first, then favour what worked, but never stop sampling completely.*

- **Explore.** For a person's first `{{EXPLORE_DATES}}` dates, date ideas
  and suggested places stay deliberately varied.
- **Lean in.** After that, ideas lean toward the kinds of date that ended in
  a mutual "see them again?" yes.
- **Keep it open.** Once every `{{FRESH_EVERY}}` weeks, one idea is always
  kept for something new, so nobody's dating closes into one routine
  (`ideaMode`).
- **Private.** What worked is read only from the person's own private close
  answers. It's never shown, and it never changes what the other person
  sees.

### 10.17 Build order
1. Open hours plus the shared pin (§10.1–10.2): the USP itself.
2. The ghost-free close (§10.5): the easiest feature to explain in
   marketing.
3. Safe first-date venues (§10.7) and fair tables with "Say hi first"
   (§10.13–10.14): the safety story, a partner channel, and the
   lowest-pressure way in.

Then the pre-plan chat limit, the open cap, rain plans, showed-up trust and
showing up pays, wingmate, explore-then-lean-in and the memory map.

### 10.18 The theory behind each rule

| Rule | Theory | What it prevents |
| --- | --- | --- |
| Private taps, revealed only when mutual | Double opt-in; honest tapping is the dominant strategy | Nobody risks rejection by going first |
| The same screen whatever the other person did | Information design; nothing to infer | Probing someone's status with taps |
| "No" and "no answer" look identical | Pooling; plausible deniability | The cost of an honest no, and ghosting |
| A place both pinned, a time both are free | Focal point (Schelling point) | Endless "where should we go?" |
| Three open at most, counting taps | Costly signalling; scarcity | Tapping everyone |
| No re-tap after Back to friends | Commitment device | Wearing someone down |
| Short chat until there's a plan | Cheap talk versus commitment | Pen pals who never meet |
| Changing the plan clears both confirms | Both commit to the same version | Changing the terms after a yes |
| Fair tables | Stable matching, clearinghouse | Seating that feels arbitrary or rigged |
| Say hi first | Costly signalling without money | Awkward, intent-free first minutes |
| Showing up pays, no-shows quietly count | Tit-for-tat in a repeated game | Flaking as a free option |
| Explore, then lean in | Optimal stopping | Settling too early, or never settling |
| One non-preference idea in every batch | Resistance to inference | Working out the other's private answers |
| No paid visibility | Platform incentive alignment | Profiting from swiping instead of dates |

## 11. Test checklist

Port these as integration tests. Each one maps to an invariant.

- [ ] The row renders identically for a viewer whether the other person is
      single or not, has dating on or off, and is compatible or not.
- [ ] A tap returns byte-identical responses whether or not the other person
      tapped, as long as the pair isn't mutual.
- [ ] B's view never changes after A taps alone (no count, no hint, no
      ordering change).
- [ ] An unlock needs all of these: both taps, both eligible, compatible both
      ways, no block, the context condition, and the same world.
- [ ] An unlock writes the connection and the Pinky in one transaction, and
      sends both people the identical neutral notice.
- [ ] Step back deletes the tap and notifies nobody.
- [ ] Back to friends and End kindly write the ended marker, and a re-tap is
      ignored.
- [ ] Turning dating off withdraws every tap and ends every Pinky.
- [ ] A block ends the Pinky and withdraws the taps in every context.
- [ ] Ending deletes the plan, idea views and period chat. With an open
      report, the Pinky is held and its chat kept. The retention job releases
      it once the reports close. A message with its own report is never
      deleted.
- [ ] Changing the plan clears both confirms. Sends no more than one unread
      plan notice. Note edits send none.
- [ ] Ideas are the same for the same pair and day, every batch has at least
      one non-shared kind, and there are never more than the daily cap.
- [ ] Notification text matches `/\b(date|pinky|romance)\b/i` → never.
- [ ] No admin route or audit row touches the Pinky tables.
- [ ] Someone outside the pair gets a 404 on the space.
- [ ] A demo account and a real account never unlock together.

Place-first (§10):

- [ ] No map or API response contains a person's location, or a count under
      `{{COUNT_HIDE_BELOW}}`.
- [ ] Pins can only be listed venues, up to `{{PINS_PER_PERSON}}`.
- [ ] After unlock, a pair sees only the pins they share, never the rest.
      Before unlock, they see none.
- [ ] The proposed time falls in both people's open hours, between the lead
      and the horizon, and neither person's week is ever returned.
- [ ] The chat refuses messages over the pre-plan limit until the plan has a
      place and a time. "A few more questions" works once per Pinky. Report
      and Block are never limited.
- [ ] A rain swap is only offered (never applied automatically) and clears
      both confirms.
- [ ] Close: both yes opens a second plan straight away. When one person
      says no, the other side resolves at the deadline, and "no" and "no
      answer" give identical results at the same time. Nobody is sent a
      message in someone else's name.
- [ ] `canTap` refuses a tap at `{{MAX_OPEN}}`, and an unlock never takes
      anyone above it.
- [ ] A no-show only counts from different people inside the window, and
      no score appears in any response.
- [ ] A wingmate's view never includes the friend's taps, Pinkies, plans or
      chats. A vouch shows only to a mutual partner, without the friend's
      name.
- [ ] A memory map entry holds only the venue and month, and survives the
      Pinky ending.
- [ ] Fair tables: after the search, no two people at different tables
      would both be happier swapping. Any swaps left are reported. No table
      is outside `{{TABLE_SIZE}}` when the headcount allows. Gender is
      never an input.
- [ ] "Say hi first" lines show only to that table's people, only inside
      the open window, are trimmed to `{{HELLO_MAX}}`, and are deleted 7
      days after.
- [ ] A reliable person comes before an unreliable one for a freed seat,
      and the reliable flag never appears in any response.
- [ ] Ideas are varied for the first `{{EXPLORE_DATES}}` dates, lean toward
      kinds with a mutual yes afterwards, and keep one new pick every
      `{{FRESH_EVERY}}` weeks.

## 12. What was Jurrgun-specific (swap these out)

- **Contexts.** Jurrgun's are a checked-in meetup table (with a 72-hour
  "People I Met" window) and a Bangkok Buddy pairing (2 finished quests).
  Use whatever "we actually met" means in your app. Pinky works best when
  the pair has already met in person as friends.
- **Places and time zone.** The 17 curated Bangkok date ideas and the
  Bangkok-day boundary.
- **Copy and colours.** The bilingual Thai/English copy, and the love-red on
  cream accent (used only at unlock).
- **Notifications.** "My people" is Jurrgun's connections page, so point the
  notices at your own equivalent.

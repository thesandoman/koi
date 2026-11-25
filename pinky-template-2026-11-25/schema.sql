-- Pinky: generic Postgres schema (see PINKY-TEMPLATE.md §5).
-- Assumes you already have accounts(id), blocks(blocker, blocked),
-- reports(reporter, target_account, target_message, status) and
-- chat_messages(id, thread, sender, created_at).

-- Layer 1: taps and connections ------------------------------------------

-- A tap: choice = 'romance'. The ended marker: context_key = 'pinky-ended:<key>', choice = 'none'.
-- context_key is the shared event id, or 'buddy:<matchId>' for an activity pairing.
create table connection_choices (
  id            text primary key,
  context_key   text not null,
  from_account  text not null references accounts(id) on delete cascade,
  to_account    text not null references accounts(id) on delete cascade,
  choice        text not null,          -- 'romance' | 'friend' | 'none' ...
  created_at    timestamptz not null default now(),
  unique (context_key, from_account, to_account)
);

-- level = 'romance' means a mutual Pinky; back to friends sets 'friend' (or the context's own level).
create table connections (
  id           text primary key,
  a_account    text not null references accounts(id) on delete cascade,   -- a < b
  b_account    text not null references accounts(id) on delete cascade,
  context_key  text not null,
  level        text not null,
  removed_at   timestamptz,
  created_at   timestamptz not null default now(),
  check (a_account < b_account),
  unique (a_account, b_account, context_key)
);

-- Layer 2: Pinky Plans ----------------------------------------------------

-- Always changed in the SAME transaction as its connection's level.
create table pinkies (
  id             text primary key,
  a_account      text not null references accounts(id) on delete cascade,  -- a < b
  b_account      text not null references accounts(id) on delete cascade,
  source         text not null,                 -- 'table' | 'buddy' | your contexts
  source_key     text not null,                 -- the context_key
  connection_id  text not null unique references connections(id) on delete cascade,
  state          text not null default 'active',-- active | paused | held
  paused_by      text,
  paused_at      timestamptz,
  ended_at       timestamptz,                   -- set when held: end of the Pinky period
  created_at     timestamptz not null default now(),
  check (a_account < b_account)
);
create index pinkies_a_idx on pinkies(a_account);
create index pinkies_b_idx on pinkies(b_account);

-- One plan per Pinky, overwritten (no history). A change of place or time clears both confirms.
create table pinky_plans (
  id              text primary key,
  pinky_id        text not null unique references pinkies(id) on delete cascade,
  place_name      text,
  idea_key        text,
  area            text,
  starts_at       timestamptz,
  note            text not null default '',     -- one shared note, no history
  a_confirmed_at  timestamptz,
  b_confirmed_at  timestamptz
);

-- "Other ideas" presses per day (capped; never shown as a counter).
create table pinky_idea_views (
  id        text primary key,
  pinky_id  text not null references pinkies(id) on delete cascade,
  day       text not null,                      -- YYYY-MM-DD in your app's time zone
  shown     integer not null default 0,
  unique (pinky_id, day)
);

-- Retention (run on a schedule) -------------------------------------------
-- 1. Delete taps whose window has closed.
-- 2. Release held Pinkies whose reports are all closed: delete their period chat
--    (created_at .. ended_at, either sender, all their threads) except messages
--    with their own report, then delete the pinkies row.

-- Access rule: no admin view, and no audit log row, may read or record these tables.

-- =========================================================================
-- Place-first features (PINKY-TEMPLATE.md §10). New: not yet run in production.
-- =========================================================================

-- Curated public venues only: no homes, no free-drop pins.
create table venues (
  key         text primary key,
  kind        text not null,                    -- coffee | walk | museum | market ...
  area        text not null,
  name        text not null,
  lat         double precision not null,        -- the venue's location, never a person's
  lng         double precision not null,
  is_public   boolean not null default true,
  active      boolean not null default true,
  outdoor     boolean not null default false,
  backup_key  text references venues(key),      -- indoor backup for rain
  safe        boolean not null default false,   -- partner "safe first-date venue"
  code_phrase text                              -- shown only inside a Pinky space
);

-- Private first-date pins. Read only by the silent unlock and by the overlap shown to a mutual pair.
create table place_pins (
  account_id  text not null references accounts(id) on delete cascade,
  venue_key   text not null references venues(key),
  created_at  timestamptz not null default now(),
  primary key (account_id, venue_key)
);

-- Daily, rounded, delayed per-venue counts for the map (computed by a job; never live).
create table venue_counts (
  venue_key   text primary key references venues(key),
  coarse      integer,                          -- null = hide (below threshold)
  computed_on date not null
);

-- Weekly free windows, local time. Never shown to anyone else.
create table open_hours (
  account_id  text not null references accounts(id) on delete cascade,
  day         smallint not null check (day between 0 and 6),   -- 0 = Sunday
  start_hour  smallint not null check (start_hour between 0 and 23),
  end_hour    smallint not null check (end_hour between 1 and 24),
  check (end_hour > start_hour),
  primary key (account_id, day, start_hour)
);

-- Pre-plan chat limit: "A few more questions" granted once per Pinky.
alter table pinkies add column extra_questions_by text;
-- Plans can be pre-filled from a shared pin at unlock.
alter table pinky_plans add column venue_key text references venues(key);
alter table pinky_plans add column proposed boolean not null default false;

-- "See them again?" Private answers; deleted with the Pinky. A second date resets them.
create table pinky_closes (
  pinky_id    text not null references pinkies(id) on delete cascade,
  account_id  text not null references accounts(id) on delete cascade,
  answer      text not null,                    -- yes | no | didnt_meet
  answered_at timestamptz not null default now(),
  primary key (pinky_id, account_id)
);

-- Showed-up trust. Kept apart from pinkies so it survives an ending; never displayed.
-- Rows older than the window are deleted by retention.
create table show_ups (
  id          text primary key,
  reporter    text not null references accounts(id) on delete cascade,
  about       text not null references accounts(id) on delete cascade,
  outcome     text not null,                    -- came | no_show | i_cancelled
  created_at  timestamptz not null default now()
);
create index show_ups_about_idx on show_ups(about, created_at);

-- Trusted contact for the home-safe escalation (the person's own, opt-in).
create table trusted_contacts (
  account_id  text primary key references accounts(id) on delete cascade,
  channel     text not null,                    -- sms | line | email ...
  address     text not null,
  created_at  timestamptz not null default now()
);

-- Wingmates: invited and accepted. A wingmate never reads taps, pinkies, plans or chats.
create table wingmates (
  account_id  text not null references accounts(id) on delete cascade,
  friend_id   text not null references accounts(id) on delete cascade,
  accepted_at timestamptz,
  primary key (account_id, friend_id)
);
create table wing_suggestions (
  id          text primary key,
  account_id  text not null references accounts(id) on delete cascade,
  friend_id   text not null references accounts(id) on delete cascade,
  venue_key   text not null references venues(key),
  state       text not null default 'pending'   -- pending | accepted | declined
);
-- One preset vouch per friend; shown to a mutual partner without the friend's name.
create table vouches (
  account_id  text not null references accounts(id) on delete cascade,
  friend_id   text not null references accounts(id) on delete cascade,
  preset      text not null,
  primary key (account_id, friend_id)
);

-- Memory map: venue and month only, never the other person. Survives the Pinky ending.
create table memories (
  account_id  text not null references accounts(id) on delete cascade,
  venue_key   text not null references venues(key),
  month       text not null,                    -- YYYY-MM
  primary key (account_id, venue_key, month)
);
-- A couple shares memory maps only when both say yes.
create table memory_shares (
  a_account   text not null references accounts(id) on delete cascade,
  b_account   text not null references accounts(id) on delete cascade,
  a_yes_at    timestamptz,
  b_yes_at    timestamptz,
  check (a_account < b_account),
  primary key (a_account, b_account)
);

-- =========================================================================
-- The four theories (PINKY-TEMPLATE.md §10.13–10.16).
-- =========================================================================

-- Hosted tables: one row per seat, written by the exchange-stable search; the host may move people.
create table table_events (
  id          text primary key,
  venue_key   text references venues(key),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  rule_note   text not null default 'Tables are made so no two people would both rather swap seats.'
);
create table table_seats (
  event_id    text not null references table_events(id) on delete cascade,
  account_id  text not null references accounts(id) on delete cascade,
  table_no    smallint not null,
  checked_in_at timestamptz,
  primary key (event_id, account_id)
);

-- "Say hi first": one line per person per table, shown only to that table, deleted 7 days after it ends.
create table hellos (
  event_id    text not null references table_events(id) on delete cascade,
  account_id  text not null references accounts(id) on delete cascade,
  line        text not null check (char_length(line) <= 80),
  created_at  timestamptz not null default now(),
  primary key (event_id, account_id)
);

-- Showing up pays: show_ups (above) already records "came"; a private "again" from a host or date also counts.
create table again_marks (
  from_account text not null references accounts(id) on delete cascade,
  to_account   text not null references accounts(id) on delete cascade,
  context_key  text not null,               -- the table event or the Pinky's source_key
  created_at   timestamptz not null default now(),
  primary key (from_account, to_account, context_key)
);

-- Freed seats at a full table go out in waitlistOrder (priority, then reliable, then first come).
create table table_waitlist (
  event_id    text not null references table_events(id) on delete cascade,
  account_id  text not null references accounts(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (event_id, account_id)
);

-- Explore, then lean in: dates had and kinds that worked are read from pinky_closes and plans;
-- this keeps the kinds a person has tried, private to them.
create table tried_kinds (
  account_id  text not null references accounts(id) on delete cascade,
  kind        text not null,
  worked      boolean not null default false,   -- ended in a mutual "see them again?" yes
  primary key (account_id, kind)
);

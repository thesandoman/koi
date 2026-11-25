# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack
- **Site (`site/`, web):** React + TypeScript + Vite + Tailwind CSS v4 + `motion`, built to static files. Hosted on Vercel (project `koi-site`) and deployable on Railway via `site/server.mjs` (repo root `package.json` and `railway.json`). `api/waitlist.js` writes one private record per sign-up to a Vercel Blob store (or forwards to a webhook); the site stores nothing else.
- **App (`app/`, native):** Expo (SDK 58) + React Native + Expo Router + TypeScript, running the unchanged `pinky-core.ts` rules on-device against labelled sample people. Prototype only: no server yet.
- **Repo:** https://github.com/thesandoman/koi (public). The backend (Postgres, API, sign-up, verification) is the next phase in `docs/superpowers/plans/`.

## Users
Single adults in Bangkok, roughly 22–40, Thai and English speakers. They are tired of swiping, chats that go nowhere, and being ghosted. Many, especially women, feel unsafe meeting strangers they only know from an app. Scam pressure (people pulled onto LINE or Facebook, money asks) is a real, local worry. They arrive on a phone, often from a friend's link.

## Product Purpose
Koi (ก้อย, the little finger; hooking little fingers, เกี่ยวก้อย, is a pinky promise) is a place-first dating app for Bangkok. You pin 3–5 public places you'd love for a first date. You "hook a pinky" on someone in private. If they hook yours too you both find out; if not, they never know. A match arrives as a plan: a place you both pinned and a time you're both free. The morning after, each person privately answers "See them again?"; both yes opens a second plan, anything else closes kindly and "no" looks identical to "no answer".

Two surfaces share this record. The website's job: let a visitor feel that mechanism by playing it, then join an area waitlist. The native app's job: be the real thing on a phone, starting as an on-device prototype. Koi is not launched; neither surface may imply it is.

## Positioning
Koi matches on a place and a time, not on a person's photos. Interest is private until mutual, and a one-sided "yes" is never visible. A neighbouring dating app could not truthfully copy "people are never on the map", "no scores", "no paying for visibility", "no AI reading your camera roll", and a close that makes ghosting structurally impossible.

## Operating Context
Surfaces: the website in `site/` is web; the native app in `app/` is adaptive (one brand and design language on iOS and Android, following each platform's conventions where it matters).

Intros are planned to open one area of Bangkok at a time, only when enough real, verified people are there (working threshold 30 verified people; a setting). Meetings happen at listed public venues, some marked as partner "safe first-date venues" with a staff code phrase. The app itself is specified in `~/koi/docs/superpowers/specs/` and `~/koi/docs/superpowers/plans/`; competitive notes are in `~/koi/docs/research/`.

## Capabilities and Constraints
- Thai and English everywhere. Thai copy is machine-drafted and needs a native read before launch.
- Static front end. No cookies, trackers or third-party requests; fonts are self-hosted.
- Waitlist collects only email and area, with explicit consent. It is live on Vercel (private Blob store in Singapore); on any other host it stays hidden until `BLOB_READ_WRITE_TOKEN` or `WAITLIST_WEBHOOK_URL` is set.
- The app prototype keeps everything on the phone and uses sample people; its "Skip ahead 1 day" tool exists only to demo the morning-after close.
- No invented statistics, testimonials, customers, partner venue names or press. "Sam" and the demo places are illustrative and must be labelled so.
- Commercial model (planned, not live, and no prices are set): "Koi Plus" subscription for planning extras (second-date planner, memory-map sharing, more wingmates) that never buys matches or visibility; a monthly fee for partner venues in the safe-venue programme; paid seats at hosted tables. Never: boosts, paid likes, paid visibility.
- Undecided: the real selfie-verification vendor, the production backend host, final pricing, launch area. One fake sign-up (`koi-selftest@example.com`) from testing sits in the waitlist store until a human deletes it.

## Brand Commitments
Name Koi (ก้อย) and the three logo files in `public/brand/` (app icon: two linked hooks on rose; wordmark with a map-pin dot on the "i"). The brand brief pins: cool paper `#F4F6F1` and deep green-black `#14201B`, rose `#C42E57` (`#F28CA6` on dark) used only at the unlock moment and on primary actions, leaf `#2E7D5B` for private/safe/confirmed, Bricolage Grotesque for headings, Inter for text, Noto Sans Thai for Thai. Tone: warm, short, plain, never cheesy; say what happens; never blame anyone.

## Evidence on Hand
Specs, a plan, research notes and logos only. There are no real users, no partner venues, no press, no metrics. Future work must not fabricate any. Research figures about other apps are company-reported or conflicting and are not used on the site.

## Product Principles
1. Show the mechanism working; never describe a feeling in place of it.
2. Privacy is a visible feature: what Koi hides is as important as what it shows.
3. Safety is part of the plan, not a warning label on it.
4. Honest about being early: no fake social proof, no urgency tricks, no autopilot.
5. Calm over clever: one memorable moment, everything else disciplined.

## Flaws in modern dating this product answers
- Swipe fatigue and endless feeds → a short daily set, then done.
- Matches that never meet (pen-pals, hoarding) → a match is a plan; a pinky with no place and time after 5 days closes quietly.
- Ghosting → the ghost-free close, with "no" indistinguishable from "no answer".
- Fake profiles and stolen photos → a liveness selfie check before you can hook a pinky.
- Scams and moving off-app on day one → contact details and money talk are held until both confirm the plan; links never sent.
- Unsafe first meetings → public listed venues only, a code phrase, "Share your plan" on your own device.
- Pressure and pestering after a no → ended pairs are never re-introduced or re-tappable; blocking is silent.
- Opaque AI curation and paid reach → pins are what you tell us; nothing inferred, nothing bought.

## Accessibility & Inclusion
WCAG 2.2 AA, tap targets at least 44px, usable at 375px wide, light and dark, respects reduced motion, visible keyboard focus, full Thai and English parity. Gender and orientation are sensitive data under Thai PDPA: never inferred, consent first.

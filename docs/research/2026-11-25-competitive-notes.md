# Competitive notes: what to learn from, and how Koi differs

Researched 2026-11-25 with web search. Most figures are company-reported or
second-hand press coverage and some conflict; those are marked. Nothing here is
used as a statistic on the website.

## What the market is doing

**Tinder (Match Group).** Moving away from pure swiping. Modes (Double Date, College),
"Chemistry" (AI-curated daily recommendations, using optional camera-roll photo
analysis; piloted in Australia and New Zealand, US and Canada from March 2026), a
Learning Mode, and live events. Product testing cost about $6M of Q4 revenue and
revenue is expected to keep falling in 2026 while it prioritises product.
Face Check (mandatory video-selfie liveness) is reported to cut bad-actor
encounters by 50% or 60% (two figures, both company-sourced). Share My Date lets
users tell friends where they're going.
Sources: [TechCrunch on Modes](https://techcrunch.com/2025/09/10/tinder-evolves-some-features-into-dating-modes/),
[Mediaweek on Sparks 2026](https://www.mediaweek.com.au/tinder-unveils-biggest-product-overhaul-in-years-at-sparks-2026-keynote),
[Dating News on Face Check](https://www.datingnews.com/apps-and-sites/tinder-reports-60-fewer-bad-actor-encounters-following-face-check-rollout/).

**Coffee Meets Bagel.** 2.0 relaunch around "intentional" dating and a rebuilt
recommendation engine. Limited daily matches (figures differ by source), plus a
Discover section where in-app currency ("beans") buys likes.
Sources: [CMB 2.0](https://ww.coffeemeetsbagel.com/blog/a-new-era-of-intentional-serious-dating-coffee-meets-bagel-worldwide-launches-2.0-version),
[Dating News](https://www.datingnews.com/apps-and-sites/coffee-meets-bagel-launches-major-redesign-as-gen-z-moves-beyond-swipe-culture/).
Revenue figures conflict across sources, so none are used.

**Bumble.** Optional government-ID verification (2025) with a badge and a
"verified only" filter, plus Share Date.
Source: [TechCrunch](https://techcrunch.com/2025/03/17/bumble-heightens-safety-measures-with-new-id-verification-feature/).

**Events and social apps.** Timeleft sells a seat at a dinner of strangers
(personality-matched, restaurant revealed shortly before, connect afterwards),
from about EUR 12.99 a seat or a subscription; scale claims are its own marketing.
Thursday shut its app and moved to in-person singles events.
Sources: [Timeleft](https://timeleft.com/blog/dinner-with-strangers/),
[Global Dating Insights on Thursday](https://www.globaldatinginsights.com/featured/thursday-shutters-dating-app-to-shift-focus-on-real-world-events/).

**Demand.** Burnout is widely reported among Gen Z (more than half "often or always"
in one 2025 survey; other reports say 79%), and surveys report many prefer meeting
through mutual friends or hobby groups. Yet in-person dating feels daunting too.
Sources: [Why Gen Z is leaving dating apps](https://www.aol.com/articles/why-gen-z-leaving-dating-170550511.html),
[PsyPost](https://www.psypost.org/gen-z-is-over-dating-apps-but-the-real-world-feels-even-more-daunting/).

**Thailand.** Tinder dominates online mentions (a May 2024 social-listening figure,
not a user count). Tinder's own survey says 99% of young Thais rate dating-app
safety features as very important. Romance scams are run by organised call-centre
gangs and often move people onto Facebook or LINE.
Sources: [Thaiger](https://thethaiger.com/hot-news/crime/police-urge-thailands-singletons-to-be-wary-of-online-dating-perils),
[Global Dating Insights](https://www.globaldatinginsights.com/news/tinder-brings-anti-scam-campaign-to-southeast-asia/).

**Not found:** Hinge-specific features (the search missed), 222 and Pie, any
independent study of whether verification protects women, and any Thailand user
counts. Treat Hinge, 222 and Pie as unresearched.

## Best practices worth taking

1. **Liveness verification is now table stakes.** Tinder made it mandatory and
   reports large drops in bad actors; Bumble badges ID checks. Koi's selfie check
   should be a liveness check, and "verified" is a plain tick, not a score.
2. **Share-your-date is table stakes.** Koi has "Share your plan", built on the
   person's own device.
3. **Cap recommendations.** CMB's limited daily set is the right instinct. Koi's
   10 intros a day with no refill matches it, without a paid currency to buy more.
4. **Reveal the venue late, connect afterwards (Timeleft).** Worth borrowing for
   hosted tables after the MVP.
5. **Events and apps are converging.** Thursday and Tinder both moved toward real
   events. Koi starts there in spirit: the unit of a match is a place and a time.
6. **Scam defence must fit Thailand.** Scammers pull people onto LINE and Facebook,
   so Koi's contact-detail gate and a short Thai-language scam note in onboarding
   are relevant, not generic.

## Where Koi is different

| | Tinder, Bumble, CMB | Timeleft, Thursday events | Koi |
|---|---|---|---|
| What you match on | A person (photos, AI, a pick) | A table or event slot | A place you'd both go, then a time |
| What a match is | A chat | A dinner with a group | A plan: place, time, confirm |
| Interest signal | Visible likes, queues, paid boosts | Not applicable | Private until mutual, and the other person can never tell |
| When it fails | Ghosting | Nothing follows | Closed kindly for both, "no" looks like "no answer" |
| Use of your data | AI reads photos and behaviour | Personality quiz | Pins are your explicit signal, no AI reads photos or chats |
| Money | Pay for reach and likes | Pay per seat | Never pay for visibility |
| Safety | Verification, share-date | Public venues | Verification, listed public venues only, code phrase, home-safe later |

## What this changes

- **Plan, Task 5:** make the verification provider a liveness selfie check (as above).
- **Plan, Task 11 and onboarding:** add a short Thai and English scam note about
  LINE and Facebook, shown once.
- **Post-MVP order to consider:** wingmate (trust through mutual friends) may deserve
  to move ahead of the memory map; tables stay first because they are the lowest-pressure way in.
- **Website:** lead with the differences in the table, never with statistics, and make
  claims only about Koi.

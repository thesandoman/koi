# Koi

A place-first dating app for Bangkok (Thai and English). People match on places they'd both actually go; a match arrives as a plan with a place and a time, and ends kindly if it doesn't work.

- `site/`: the marketing site and interactive demo (live on Vercel).
- `app/`: the Expo + React Native app (on-device prototype using the real rules). Its web export is served by the site at `/app`; regenerate it with `npm run build:app` (writes `site/public/app/`, which is committed so every host can serve it).
- `docs/superpowers/specs/`: the approved MVP design.
- `docs/superpowers/plans/`: the implementation plan.
- `docs/research/`: competitive notes.
- `pinky-template-2026-11-25/`: the rules (`PINKY-TEMPLATE.md`), pure core (`pinky-core.ts`) and starting schema (`schema.sql`).
- `koi-logo/`: brand SVGs.
- `PRODUCT.md`: the shared product record (users, purpose, positioning, brand, constraints) for both surfaces.

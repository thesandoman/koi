# Koi site

React + TypeScript + Vite + Tailwind CSS v4 + `motion`. Built to static files and deployed on Vercel. Two components are adapted from 21st.dev: the tilting Phone Scroll Hero and the spring Segmented Control.

- Develop: `npm install && npm run dev`
- Build: `npm run build` (output in `dist/`)
- The waitlist form only appears when `WAITLIST_WEBHOOK_URL` is set in Vercel. `api/waitlist.js` forwards `{ email, area, locale, consentAt, source }` to that URL and stores nothing itself.
- No cookies, trackers or third-party requests; fonts are self-hosted from `public/fonts/`.
- Thai copy (`src/i18n-strings.ts`) is machine-drafted and needs a native read before launch.
- Demo venues and "Sam" are illustrative. Do not add statistics, testimonials or partner names.
- Product truth: `../PRODUCT.md`. Surface strategy: `.impeccable/surfaces/index-html.md`.

## Hosting

- **Vercel:** deploys from this folder (`vercel deploy --prod`); `api/waitlist.js` runs as a Vercel function.
- **Railway:** the repo root has `package.json` and `railway.json`; Railway runs `npm run build`, then `node site/server.mjs`, which serves `dist/` and the same `/api/waitlist` handler, with a `/healthz` check. Set `BLOB_READ_WRITE_TOKEN` (the existing private Vercel Blob store) or `WAITLIST_WEBHOOK_URL` in the Railway service's variables to open the waitlist; with neither, the page says the list isn't open yet.

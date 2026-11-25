# Koi app (Expo + React Native)

An on-device prototype of the Koi MVP flows: onboarding with consent, a people-free map with pins, free times, daily introductions, private "hook a pinky", a plan at a shared place and time, chat with the plan-first limit and scam nudges, the ghost-free close, and the ways out.

- **Rules:** `src/rules/pinky-core.ts` is copied verbatim from `../pinky-template-2026-11-25/`. `src/rules/koi-rules.ts` adds the Koi-only rules (age check at unlock, message scan, stale close, plan place check).
- **People are sample people.** Their pins, hours and decisions are hidden from the UI and used only by the silent unlock check. Everything is saved on the phone (AsyncStorage); there is no server yet.
- **Prototype tools:** Me > "Skip ahead 1 day" moves this phone's clock so you can see the morning-after close.

```
npm install
npx expo start        # then press i, a or w
npm run typecheck
```

Thai copy is machine-drafted and needs a native read. The backend (Postgres, API, real sign-up and verification) is the next phase in `../docs/superpowers/plans/`.

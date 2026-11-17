# Ayo Arena

> The Yorùbá seed-sowing classic, in your pocket.

## What's built

- Full **Ayo/Oware (abapa) rules engine** in `src/game/ayo.ts`: counter-clockwise sowing that skips the origin pit, 2s-and-3s chain captures, grand-slam rule, must-feed rule, cycle limit
- **Alpha-beta minimax AI** (easy / medium / hard) — the medium AI won 40/40 games against random play in testing; 300 simulated games conserved all 48 seeds
- Pass-and-play mode, seed-by-seed sowing animation, win/loss record

## Next

- Sound of seeds, wooden board art, online play, Yorùbá-language UI and rule variants

## Run it

```bash
npm install          # already done once after scaffolding
npx expo start       # then press i (iOS), a (Android) or w (web)
npm run typecheck
npx expo lint
```

Built on **Expo SDK 58** (React Native 0.88, React 19.3), Expo Router, TypeScript.
Everything is stored on-device with AsyncStorage (`src/lib/storage.ts`); there is no backend yet.

## Structure

- `src/app/` — screens (Expo Router; every file is a route)
- `src/brand.ts` — app name, brand colours, screen titles
- `src/theme.ts` — light/dark design tokens
- `src/components/ui.tsx` — shared UI primitives

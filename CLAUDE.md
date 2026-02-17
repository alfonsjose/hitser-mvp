# Hitser MVP

A music timeline game where players guess the release year of songs by placing them in chronological order on a timeline.

## Project Structure

```
/backend/    — FastAPI + Python (Uvicorn, Pydantic, httpx)
/frontend/   — React 19 + Vite + TypeScript + Tailwind CSS
/mobile/     — React Native (Expo 54, expo-router, expo-av)
/songs/      — songlist.json (song database)
```

## Backend

- **Entry point:** `backend/app/main.py` (FastAPI)
- **Game logic:** `backend/app/game.py`
- **Models:** `backend/app/models.py`
- **Spotify integration:** `backend/app/spotify.py`
- **Run:** `uvicorn app.main:app --reload` from `/backend`
- **Config:** `.env` (see `.env.example`)

## Frontend (Web)

- **Stack:** React 19 + Vite + TypeScript + Tailwind CSS + @dnd-kit (drag-and-drop)
- **Screens:** `frontend/src/screens/` — SetupScreen, GameScreen, ResultsScreen
- **API client:** `frontend/src/api.ts`
- **Run:** `npm run dev` from `/frontend`

## Mobile (React Native / Expo)

- **Stack:** Expo 54, expo-router (file-based routing), expo-audio, react-native-reanimated
- **Routing:** `mobile/app/` — file-based with expo-router
  - `app/index.tsx` — SetupScreen (home)
  - `app/game/[id].tsx` — GameScreen
  - `app/results/[id].tsx` — ResultsScreen
  - `app/_layout.tsx` — Root layout + navigation
- **Components:** `mobile/components/` — AudioPlayer, Timeline, PlacementResult, PassScreen
- **API client:** `mobile/api/client.ts`
- **Colors:** `mobile/constants/colors.ts`
- **Run:** `npx expo start` from `/mobile`
- **Config:** `mobile/app.json` (dark UI, portrait-only, scheme: "hitser")

## Key Conventions

- Game flow: Setup → Game (draw songs, place on timeline) → Results (podium + scores)
- Pass-and-play multiplayer on a single device
- Dark theme throughout (`#0f0d1a` background)
- API base URL switches between local dev IP and production based on `__DEV__`

## Common Commands

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# Mobile
cd mobile && npx expo start
cd mobile && npx expo start --ios
cd mobile && npx expo start --android
```

# Multiplayer Mode — Implementation Plan

## Current State

The game is **pass-and-play** on a single device: players share one screen, a "pass device" overlay enforces turn privacy, and all state lives in a Python dict on the backend with REST-only APIs. There are no WebSockets, no player identity, no persistence, and no lobby system.

---

## Option A: WebSocket Multiplayer (Recommended)

Each player joins from their own device via a shareable link. Real-time sync via FastAPI WebSockets.

### New Screens / Flow

```
Host creates game → gets link → shares with friends
                                      ↓
Players open link → JoinScreen (enter name) → LobbyScreen (wait for all)
                                                     ↓
                                              Host clicks "Start"
                                                     ↓
                                              GameScreen (real-time)
                                                     ↓
                                              ResultsScreen
```

### Backend Changes

| File | Change |
|---|---|
| `app/models.py` | Add `PlayerSession` (id, name, game_id, connected), `WSEvent` enum, `JoinGameRequest` |
| `app/websocket.py` **(new)** | `ConnectionManager` — tracks WebSocket per player per game, `broadcast()` / `send_to()` helpers |
| `app/game.py` | Add lobby phase (`LOBBY → PLAYING → FINISHED`), player join/ready logic, emit events on every state mutation |
| `app/main.py` | Add `WS /ws/game/{game_id}`, `POST /api/game/{game_id}/join`, `GET /api/game/{game_id}/lobby` |

**Key events broadcast over WS:**
- `player_joined`, `player_left`, `player_ready`
- `game_started`, `turn_started`, `song_drawn`
- `song_placed` (with result), `turn_ended`
- `game_finished`

**Privacy:** The current song's year is only sent to the active player; other players see title/artist but not the answer until placement.

### Frontend Changes

| File | Change |
|---|---|
| `src/api.ts` | Add `joinGame()`, `getlobby()`, WebSocket connect/reconnect helper |
| `src/hooks/useGameSocket.ts` **(new)** | Custom hook: connects WS, dispatches events, auto-reconnects |
| `src/App.tsx` | Add routes `/join/:gameId`, `/lobby/:gameId` |
| `src/screens/JoinScreen.tsx` **(new)** | Name input + join button |
| `src/screens/LobbyScreen.tsx` **(new)** | Player list, ready toggles, share link/copy button, host "Start" button |
| `src/screens/GameScreen.tsx` | Replace polling with WS events; show "waiting for [player]..." when not your turn; remove `PassScreen` |
| `src/screens/SetupScreen.tsx` | After creating game, redirect to `/lobby/:gameId` instead of `/game/:gameId` |

### State Management

Add a lightweight store (React Context or Zustand) so WebSocket events update game state in one place and all components react.

### Reconnection

- On disconnect, auto-retry with exponential backoff (1s → 2s → 4s → 8s)
- Server keeps player slot for 60s grace period
- On reconnect, server sends full current state snapshot

### Scope & Complexity

- **~15 files** touched/created
- **Medium-high complexity** — WebSocket lifecycle, concurrency, reconnection edge cases
- Keeps existing REST endpoints working (backwards compatible)

---

## Option B: Simple Room Code + Polling (Lighter alternative)

Same multi-device UX but without WebSockets — uses short polling (every 2s) instead.

### How It Works

- Host creates game, gets a 4-letter room code (e.g. `ABCD`)
- Players go to the app and enter the code + their name
- Frontend polls `GET /api/game/{id}` every 2 seconds to detect state changes
- Server response includes a `version` counter; frontend only re-renders when version bumps

### Backend Changes

| File | Change |
|---|---|
| `app/models.py` | Add `player_id` field, `room_code`, `version` counter on GameState |
| `app/game.py` | Add join logic, room code generation, bump version on every mutation |
| `app/main.py` | Add `POST /api/game/{game_id}/join`, `GET /api/game/{game_id}/lobby` |

No new files needed — just extend existing ones.

### Frontend Changes

| File | Change |
|---|---|
| `src/api.ts` | Add `joinGame()`, `getLobby()` |
| `src/hooks/usePolling.ts` **(new)** | Generic polling hook with version-based change detection |
| `src/screens/JoinScreen.tsx` **(new)** | Room code input |
| `src/screens/LobbyScreen.tsx` **(new)** | Player list with polling |
| `src/screens/GameScreen.tsx` | Add polling for state updates, disable controls when not your turn |

### Trade-offs

| | WebSocket (A) | Polling (B) |
|---|---|---|
| **Latency** | Instant (~50ms) | 1-2s delay |
| **Server load** | Low (idle connections) | Higher (constant requests) |
| **Complexity** | Higher (WS lifecycle) | Lower (just REST) |
| **Reconnection** | Needs explicit handling | Free (each poll reconnects) |
| **UX feel** | Snappy, real-time | Slightly sluggish |
| **Files changed** | ~15 | ~8 |

### Scope & Complexity

- **~8 files** touched/created
- **Medium complexity** — simpler than WS but polling logic + version tracking
- Easy to upgrade to WebSockets later

---

## Option C: Hybrid — Start with Polling, Add WebSocket Later

Build Option B first as the MVP, then layer WebSocket support on top.

### Phase 1 (Polling MVP)
- Room codes, join flow, lobby, multi-device play
- 2-second polling for state sync
- Get the UX right without WS complexity

### Phase 2 (WebSocket upgrade)
- Add WS endpoint alongside polling
- Frontend detects WS support and prefers it
- Polling remains as fallback

### Scope
- Phase 1: same as Option B (~8 files)
- Phase 2: add ~5 more files for WS layer

---

## Shared Requirements (All Options)

Regardless of approach, these are needed:

1. **Player Identity** — Each player gets a UUID stored in localStorage so the server knows who is who across requests
2. **Lobby Phase** — New `GamePhase.LOBBY` before `PLAYING`
3. **Join Flow** — New screen where non-host players enter the game
4. **Turn Gating** — Only the active player can draw/place; others see a waiting state
5. **Link/Code Sharing** — Copy-to-clipboard button for the game URL or room code

---

## Recommendation

**Option A (WebSocket)** if you want the best UX — instant updates, no lag, feels like a real multiplayer game.

**Option B (Polling)** if you want to ship faster with less risk — simpler code, fewer edge cases, still a solid multi-device experience.

**Option C (Hybrid)** if you want the pragmatic middle ground — ship quickly, upgrade later.

---
---

# React Native Mobile App — Implementation Plan

## Approach: React Native with Expo

Rebuild the UI with native components for a smooth, native feel on iOS and Android while reusing the same API contract and game logic from the web app.

---

## Project Structure

```
/mobile/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout + navigation config
│   ├── index.tsx                 # SetupScreen (home)
│   ├── game/[id].tsx             # GameScreen
│   └── results/[id].tsx          # ResultsScreen
├── components/
│   ├── AudioPlayer.tsx           # expo-av based audio player
│   ├── Timeline.tsx              # Horizontal FlatList timeline
│   ├── PlacementResult.tsx       # Correct/wrong modal
│   └── PassScreen.tsx            # "Pass to next player" overlay
├── api/
│   └── client.ts                 # Shared API functions + types
├── constants/
│   └── colors.ts                 # Color palette
└── app.json                      # Expo config
```

---

## Key Dependencies

| Package | Replaces (Web) | Purpose |
|---|---|---|
| `expo` | Vite | Build system, dev server |
| `expo-router` | react-router-dom | File-based navigation |
| `expo-av` | HTML5 `<audio>` | Song preview playback |
| `expo-linear-gradient` | CSS `bg-gradient-to-r` | Purple-to-cyan gradients |
| `@expo/vector-icons` | Inline SVGs | Icons (play, pause, plus, X) |
| `expo-clipboard` | `navigator.clipboard` | Copy game link |
| `react-native-reanimated` | CSS transitions | Smooth animations |

No external styling library needed — use React Native `StyleSheet` directly for full control and best performance.

---

## Screen-by-Screen Migration

### 1. SetupScreen (`app/index.tsx`)

**Web → Native mapping:**

| Web Element | React Native Element |
|---|---|
| `<input>` | `<TextInput>` |
| `<button>` | `<Pressable>` |
| Tailwind `flex gap-3` | `View` with `flexDirection: 'row', gap: 12` |
| `bg-gradient-to-r` | `<LinearGradient>` |
| `rounded-2xl` | `borderRadius: 16` |
| Scroll page | `<ScrollView>` or `<KeyboardAvoidingView>` |

**State** — identical to web:
- `playerNames`, `rounds`, `genres`, `useAllGenres`, `loading`, `error`

**Key consideration:** Wrap in `KeyboardAvoidingView` so the player name inputs don't get hidden by the on-screen keyboard.

---

### 2. GameScreen (`app/game/[id].tsx`)

**Same state machine, native components:**

| Phase | What Shows |
|---|---|
| `loading` | `<ActivityIndicator>` |
| `pass` | `PassScreen` component (full-screen `<Modal>`) |
| `auto-placed` | Auto-place modal (`<Modal>`) |
| `placing` | `AudioPlayer` + `Timeline` (interactive) |
| `result` | `PlacementResult` modal (`<Modal>`) |

**Audio:** Replace `new Audio(url)` with:
```typescript
const { sound } = await Audio.Sound.createAsync({ uri: preview_url });
await sound.playAsync();
```

**Timeline:** `<FlatList horizontal>` with `SongCard` items and `DropSlot` separators via `ItemSeparatorComponent`.

---

### 3. ResultsScreen (`app/results/[id].tsx`)

**Podium layout:** Use absolute positioning or flexbox to create the 2nd-1st-3rd podium effect.

**Player timelines:** `<FlatList horizontal>` per player, nested in a vertical `<ScrollView>`.

---

## Component Migration

### AudioPlayer

| Feature | Web | React Native |
|---|---|---|
| Playback | `HTMLAudioElement` | `expo-av` `Audio.Sound` |
| Progress bar | `<div>` with width % | `<View>` with animated width |
| Time display | `timeupdate` event | `sound.getStatusAsync()` polling or `setOnPlaybackStatusUpdate` |
| Auto-play | `audio.play()` | `sound.playAsync()` |

Use `setOnPlaybackStatusUpdate` callback for real-time progress — no polling needed.

### Timeline

| Feature | Web | React Native |
|---|---|---|
| Scroll | `overflow-x-auto` div | `<FlatList horizontal>` |
| Song cards | Styled divs | `<View>` + `<Text>` |
| Drop slots | Dashed-border buttons | `<Pressable>` with dashed border |
| Vinyl icon | CSS circles | `<View>` with `borderRadius` |

### PlacementResult

| Feature | Web | React Native |
|---|---|---|
| Overlay | Fixed-position div | `<Modal transparent>` |
| Animation | CSS `@keyframes` | `react-native-reanimated` `FadeIn` |
| Backdrop | `bg-black/60` | `View` with `backgroundColor: 'rgba(0,0,0,0.6)'` |

### PassScreen

Direct port — just a full-screen `<Modal>` with the player name and "I'm Ready" button.

---

## Color Palette (`constants/colors.ts`)

```typescript
export const Colors = {
  background: '#0f0d1a',
  surface: '#1e1b2e',
  surfaceLight: '#2a2540',
  surfaceLighter: '#3a3455',
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  accent: '#06b6d4',
  accentLight: '#67e8f9',
  correct: '#22c55e',
  wrong: '#ef4444',
  text: '#f1f0f5',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
};
```

---

## API Client (`api/client.ts`)

Identical logic to web `api.ts` with one change — the base URL:

```typescript
const API_BASE = __DEV__
  ? 'http://<LOCAL_IP>:8000/api'   // Expo dev on physical device
  : 'https://your-production.com/api';
```

All types (`Song`, `Player`, `GameSummary`, `PlacementResult`, etc.) are copied as-is.

---

## What's Different from the Web App

| Concern | Web | Mobile |
|---|---|---|
| **Back button** | Browser back | Android hardware back — handle with `useNavigation` |
| **Audio focus** | Just works | Need `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })` |
| **Keyboard** | Auto-handled | `KeyboardAvoidingView` on SetupScreen |
| **Haptics** | N/A | Add `expo-haptics` feedback on correct/wrong placement |
| **Status bar** | N/A | Set to light content on dark background |
| **Safe areas** | N/A | Wrap in `SafeAreaView` for notch/island devices |
| **Sharing** | `navigator.clipboard` | `expo-sharing` or `Share` API for game links |

---

## Build & Distribution

```bash
# Development
npx expo start              # Start dev server
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator

# Production builds
npx eas build --platform ios
npx eas build --platform android

# App Store / Play Store submission
npx eas submit --platform ios
npx eas submit --platform android
```

Requires an Expo account and EAS (Expo Application Services) for production builds.

---

## Implementation Order

1. **Scaffold** — `npx create-expo-app mobile --template blank-typescript`, install deps
2. **API client + types** — Copy from web, update base URL
3. **Colors + layout** — Set up root layout, navigation, color constants
4. **SetupScreen** — Players, rounds, genres (most straightforward port)
5. **GameScreen** — State machine, audio player, timeline, modals
6. **ResultsScreen** — Podium, scores, timelines
7. **Polish** — Haptics, animations, safe areas, keyboard handling
8. **Test on devices** — iOS + Android physical devices

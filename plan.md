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

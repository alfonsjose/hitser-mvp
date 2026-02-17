import { Platform } from 'react-native';

// In dev, Android emulator uses 10.0.2.2 for host; iOS simulator uses localhost
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE = __DEV__
  ? `http://${DEV_HOST}:8000/api`
  : (process.env.EXPO_PUBLIC_API_URL ?? 'https://your-production.com/api');

const FETCH_TIMEOUT_MS = 10_000;

// --- Types ---

export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  preview_url: string | null;
  genre: string;
}

export interface TimelineCard {
  song: Song;
  position: number;
}

export interface Player {
  name: string;
  timeline: TimelineCard[];
  score: number;
}

export interface GameSummary {
  id: string;
  phase: 'playing' | 'finished';
  players: Player[];
  current_player_index: number;
  current_player_name: string;
  current_song: Song | null;
  current_round: number;
  rounds_per_player: number;
  total_turns_taken: number;
}

export interface PlayResponse extends GameSummary {
  played_song: Song;
  auto_placed: boolean;
}

export interface PlacementResult {
  correct: boolean;
  actual_year: number;
  song: Song;
  message: string;
}

export interface PlaceResponse {
  result: PlacementResult;
  game: GameSummary;
}

// --- API Functions ---

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getGenres() {
  return request<{ genres: string[] }>('/genres');
}

export function createGame(playerNames: string[], roundsPerPlayer: number, genres: string[]) {
  return request<GameSummary>('/game', {
    method: 'POST',
    body: JSON.stringify({ player_names: playerNames, rounds_per_player: roundsPerPlayer, genres }),
  });
}

export function getGame(gameId: string) {
  return request<GameSummary>(`/game/${gameId}`);
}

export function playSong(gameId: string) {
  return request<PlayResponse>(`/game/${gameId}/play`, { method: 'POST' });
}

export function placeSong(gameId: string, position: number) {
  return request<PlaceResponse>(`/game/${gameId}/place`, {
    method: 'POST',
    body: JSON.stringify({ position }),
  });
}

export function nextTurn(gameId: string) {
  return request<GameSummary>(`/game/${gameId}/next`, { method: 'POST' });
}

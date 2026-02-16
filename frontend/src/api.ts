const API_BASE = '/api';

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

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export function createGame(playerNames: string[], roundsPerPlayer: number) {
  return request<GameSummary>('/game', {
    method: 'POST',
    body: JSON.stringify({ player_names: playerNames, rounds_per_player: roundsPerPlayer }),
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

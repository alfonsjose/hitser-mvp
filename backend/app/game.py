from __future__ import annotations

import json
import os
import random
from pathlib import Path
from typing import Optional

from .models import (
    CreateGameRequest,
    GamePhase,
    GameState,
    GameSummary,
    PlacementResult,
    Player,
    Song,
    TimelineCard,
)

SONGS_PATH = Path(__file__).parent.parent.parent / "songs" / "songlist.json"

_games: dict[str, GameState] = {}


def _load_songs() -> list[dict]:
    """Load the curated song list from JSON."""
    if not SONGS_PATH.exists():
        return []
    with open(SONGS_PATH) as f:
        return json.load(f)


def create_game(req: CreateGameRequest) -> GameState:
    """Create a new game with the given players and settings."""
    if len(req.player_names) < 2 or len(req.player_names) > 8:
        raise ValueError("Need 2-8 players")
    if req.rounds_per_player not in (10, 15, 20):
        raise ValueError("Rounds per player must be 10, 15, or 20")

    all_songs = _load_songs()
    total_needed = len(req.player_names) * req.rounds_per_player
    if len(all_songs) < total_needed:
        # Use what we have, possibly with repeats for very large games
        deck_songs = all_songs[:]
        while len(deck_songs) < total_needed:
            deck_songs.extend(all_songs)
        deck_songs = deck_songs[:total_needed]
    else:
        deck_songs = random.sample(all_songs, total_needed)

    random.shuffle(deck_songs)
    deck = [Song(**s) for s in deck_songs]

    players = [Player(name=name) for name in req.player_names]

    game = GameState(
        players=players,
        deck=deck,
        rounds_per_player=req.rounds_per_player,
    )

    _games[game.id] = game
    return game


def get_game(game_id: str) -> Optional[GameState]:
    """Retrieve a game by ID."""
    return _games.get(game_id)


def play_next_song(game_id: str) -> Optional[Song]:
    """Draw the next song from the deck for the current player."""
    game = _games.get(game_id)
    if not game or game.phase == GamePhase.FINISHED:
        return None

    if not game.deck:
        game.phase = GamePhase.FINISHED
        return None

    song = game.deck.pop(0)
    game.current_song = song

    # For the very first card of a player (empty timeline), auto-place it
    current_player = game.players[game.current_player_index]
    if len(current_player.timeline) == 0:
        current_player.timeline.append(TimelineCard(song=song, position=0))
        current_player.score += 1
        game.current_song = None
        return song

    return song


def place_song(game_id: str, position: int) -> Optional[PlacementResult]:
    """Place the current song at the given position on the player's timeline."""
    game = _games.get(game_id)
    if not game or not game.current_song:
        return None

    player = game.players[game.current_player_index]
    song = game.current_song

    # Sort timeline by year to get the actual order
    sorted_timeline = sorted(player.timeline, key=lambda c: c.song.year)

    # Check if placement is correct
    correct = _is_placement_correct(sorted_timeline, song, position)

    if correct:
        # Insert the card into the timeline
        card = TimelineCard(song=song, position=position)
        # Insert at the correct position
        player.timeline.insert(position, card)
        # Renumber positions
        for i, c in enumerate(player.timeline):
            c.position = i
        player.score += 1
        message = f"Correct! {song.title} was released in {song.year}."
    else:
        message = f"Wrong! {song.title} was released in {song.year}."

    game.current_song = None

    result = PlacementResult(
        correct=correct,
        actual_year=song.year,
        song=song,
        message=message,
    )

    return result


def _is_placement_correct(
    timeline: list[TimelineCard], song: Song, position: int
) -> bool:
    """Check if placing a song at the given position is chronologically correct."""
    if len(timeline) == 0:
        return True

    # Get the years of songs currently on the timeline (sorted by position)
    years = [c.song.year for c in timeline]
    new_year = song.year

    # Position 0 = before all existing cards
    # Position len(timeline) = after all existing cards
    # Position i = between card i-1 and card i

    if position < 0 or position > len(timeline):
        return False

    # Check left neighbor
    if position > 0:
        left_year = years[position - 1]
        if new_year < left_year:
            return False

    # Check right neighbor
    if position < len(timeline):
        right_year = years[position]
        if new_year > right_year:
            return False

    return True


def advance_turn(game_id: str) -> Optional[GameSummary]:
    """Advance to the next player's turn."""
    game = _games.get(game_id)
    if not game:
        return None

    game.total_turns_taken += 1

    # Move to next player
    game.current_player_index = (
        game.current_player_index + 1
    ) % len(game.players)

    # If we've gone around once, increment the round
    if game.current_player_index == 0:
        game.songs_played_this_round += 1
        game.current_round += 1

    # Check if game is finished
    if game.current_round > game.rounds_per_player:
        game.phase = GamePhase.FINISHED

    if not game.deck:
        game.phase = GamePhase.FINISHED

    return _make_summary(game)


def get_game_summary(game: GameState) -> GameSummary:
    """Create a summary of the game state."""
    return _make_summary(game)


def _make_summary(game: GameState) -> GameSummary:
    current_name = game.players[game.current_player_index].name
    return GameSummary(
        id=game.id,
        phase=game.phase,
        players=game.players,
        current_player_index=game.current_player_index,
        current_player_name=current_name,
        current_song=game.current_song,
        current_round=min(game.current_round, game.rounds_per_player),
        rounds_per_player=game.rounds_per_player,
        total_turns_taken=game.total_turns_taken,
    )

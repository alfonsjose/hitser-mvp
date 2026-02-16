from __future__ import annotations

import uuid
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class GamePhase(str, Enum):
    PLAYING = "playing"
    FINISHED = "finished"


class Song(BaseModel):
    id: str
    title: str
    artist: str
    year: int
    preview_url: Optional[str] = None
    genre: str = ""


class TimelineCard(BaseModel):
    song: Song
    position: int  # order on the timeline


class Player(BaseModel):
    name: str
    timeline: list[TimelineCard] = Field(default_factory=list)
    score: int = 0


class PlacementResult(BaseModel):
    correct: bool
    actual_year: int
    song: Song
    message: str


class GameState(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    players: list[Player] = Field(default_factory=list)
    current_player_index: int = 0
    current_song: Optional[Song] = None
    deck: list[Song] = Field(default_factory=list)
    rounds_per_player: int = 10
    current_round: int = 1
    songs_played_this_round: int = 0
    phase: GamePhase = GamePhase.PLAYING
    total_turns_taken: int = 0


class CreateGameRequest(BaseModel):
    player_names: list[str]
    rounds_per_player: int = 10
    genres: list[str] = Field(default_factory=list)  # empty = all genres


class PlaceRequest(BaseModel):
    position: int  # index in the timeline where the song should be inserted


class GameSummary(BaseModel):
    id: str
    phase: GamePhase
    players: list[Player]
    current_player_index: int
    current_player_name: str
    current_song: Optional[Song] = None
    current_round: int
    rounds_per_player: int
    total_turns_taken: int
    song_revealed: bool = False

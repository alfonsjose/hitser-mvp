from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .game import (
    advance_turn,
    create_game,
    get_game,
    get_game_summary,
    place_song,
    play_next_song,
)
from .models import CreateGameRequest, PlaceRequest

app = FastAPI(title="Hitser MVP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/game")
def api_create_game(req: CreateGameRequest):
    try:
        game = create_game(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return get_game_summary(game)


@app.get("/api/game/{game_id}")
def api_get_game(game_id: str):
    game = get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return get_game_summary(game)


@app.post("/api/game/{game_id}/play")
def api_play_song(game_id: str):
    game = get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    song = play_next_song(game_id)
    if song is None:
        raise HTTPException(status_code=400, detail="No more songs or game finished")

    summary = get_game_summary(game)
    # Check if the song was auto-placed (first card)
    auto_placed = game.current_song is None
    return {
        **summary.model_dump(),
        "played_song": song.model_dump(),
        "auto_placed": auto_placed,
    }


@app.post("/api/game/{game_id}/place")
def api_place_song(game_id: str, req: PlaceRequest):
    result = place_song(game_id, req.position)
    if result is None:
        raise HTTPException(
            status_code=400, detail="No song to place or game not found"
        )

    game = get_game(game_id)
    summary = get_game_summary(game) if game else None
    return {
        "result": result.model_dump(),
        "game": summary.model_dump() if summary else None,
    }


@app.post("/api/game/{game_id}/next")
def api_next_turn(game_id: str):
    summary = advance_turn(game_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return summary

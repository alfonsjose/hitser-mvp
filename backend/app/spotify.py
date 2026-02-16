from __future__ import annotations

import os
import time
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

_token_cache: dict[str, str | float] = {}


async def _get_access_token() -> str:
    """Get a Spotify access token using Client Credentials flow."""
    now = time.time()
    if _token_cache.get("token") and _token_cache.get("expires_at", 0) > now:
        return str(_token_cache["token"])

    client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        raise RuntimeError(
            "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set"
        )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
        )
        resp.raise_for_status()
        data = resp.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600) - 60
    return data["access_token"]


async def get_track(track_id: str) -> Optional[dict]:
    """Fetch a single track from Spotify."""
    token = await _get_access_token()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/tracks/{track_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            return None
        return resp.json()


async def get_tracks_bulk(track_ids: list[str]) -> list[dict]:
    """Fetch multiple tracks from Spotify (up to 50 at a time)."""
    token = await _get_access_token()
    results = []

    for i in range(0, len(track_ids), 50):
        batch = track_ids[i : i + 50]
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SPOTIFY_API_BASE}/tracks",
                params={"ids": ",".join(batch)},
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                results.extend(data.get("tracks", []))

    return results


async def refresh_preview_urls(songs: list[dict]) -> list[dict]:
    """Refresh preview URLs for a list of songs using Spotify API."""
    track_ids = [s["id"] for s in songs]
    tracks = await get_tracks_bulk(track_ids)

    track_map = {}
    for t in tracks:
        if t and t.get("preview_url"):
            track_map[t["id"]] = t["preview_url"]

    refreshed = []
    for s in songs:
        url = track_map.get(s["id"])
        if url:
            refreshed.append({**s, "preview_url": url})

    return refreshed

#!/usr/bin/env python3
"""
Build the curated song list for Hitser MVP.

Usage:
    python build_songlist.py

Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.
Fetches well-known hits across decades from Spotify and outputs /songs/songlist.json.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

SEARCH_QUERIES = [
    "top hits 1960s",
    "best songs 1965",
    "classic rock 1960s",
    "top hits 1970s",
    "best songs 1975",
    "disco hits 1970s",
    "classic rock 1970s",
    "top hits 1980s",
    "best songs 1985",
    "pop hits 1980s",
    "rock hits 1980s",
    "new wave 1980s",
    "top hits 1990s",
    "best songs 1995",
    "pop hits 1990s",
    "rock hits 1990s",
    "grunge 1990s",
    "hip hop 1990s",
    "top hits 2000s",
    "best songs 2005",
    "pop hits 2000s",
    "rock hits 2000s",
    "r&b hits 2000s",
    "top hits 2010s",
    "best songs 2015",
    "pop hits 2010s",
    "top hits 2020s",
    "best songs 2022",
    "popular songs 2023",
    "classic soul motown",
    "classic country hits",
    "latin pop hits",
    "best ballads ever",
    "dance hits all time",
    "one hit wonders",
]

OUTPUT_PATH = Path(__file__).parent.parent.parent / "songs" / "songlist.json"


async def get_token() -> str:
    client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        print("Error: Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET")
        sys.exit(1)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def search_tracks(token: str, query: str, limit: int = 20) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/search",
            params={"q": query, "type": "track", "limit": limit, "market": "US"},
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            print(f"  Warning: search failed for '{query}': {resp.status_code}")
            return []
        data = resp.json()
        return data.get("tracks", {}).get("items", [])


def extract_song(track: dict) -> dict | None:
    preview_url = track.get("preview_url")
    if not preview_url:
        return None

    album = track.get("album", {})
    release_date = album.get("release_date", "")
    if not release_date:
        return None

    year = int(release_date[:4])
    if year < 1960 or year > 2024:
        return None

    artists = track.get("artists", [])
    artist_name = artists[0]["name"] if artists else "Unknown"

    return {
        "id": track["id"],
        "title": track["name"],
        "artist": artist_name,
        "year": year,
        "preview_url": preview_url,
        "genre": "",
    }


async def main():
    print("Fetching Spotify access token...")
    token = await get_token()

    seen_ids: set[str] = set()
    songs: list[dict] = []

    for query in SEARCH_QUERIES:
        print(f"Searching: {query}")
        tracks = await search_tracks(token, query)
        for track in tracks:
            song = extract_song(track)
            if song and song["id"] not in seen_ids:
                seen_ids.add(song["id"])
                songs.append(song)
        print(f"  Found {len(tracks)} tracks, {len(songs)} unique songs so far")

    # Sort by year
    songs.sort(key=lambda s: s["year"])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(songs, f, indent=2)

    print(f"\nDone! Saved {len(songs)} songs to {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())

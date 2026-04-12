import asyncio
import os

# Set env vars before any app module is imported — supabase_client.py and
# discussions.py read these at module import time.
os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "placeholder")
os.environ.setdefault("STORAGE_KEY_DISCUSSION", "placeholder")

import pytest
import httpx
from httpx import ASGITransport
from unittest.mock import AsyncMock

from main import app


@pytest.fixture(autouse=True)
def reset_module_state(monkeypatch):
    """Reset module-level singletons and caches before every test.

    Without this, the first test to populate the Supabase singleton, genre
    cache, or in-memory cache would silently affect every subsequent test.
    """
    import database.supabase_client as sc
    import utilities.genreFunctions as gf
    import utilities.cache as cache_mod

    monkeypatch.setattr(sc, "_supabase", None)
    monkeypatch.setattr(sc, "_supabase_lock", asyncio.Lock())
    monkeypatch.setattr(gf, "_genre_cache", None)
    monkeypatch.setattr(gf, "_genre_cache_fetched_at", None)
    monkeypatch.setattr(gf, "_genre_cache_lock", asyncio.Lock())
    monkeypatch.setattr(cache_mod, "_cache", {})


@pytest.fixture
async def async_client():
    """Async HTTP client wired directly to the FastAPI ASGI app.

    Uses ASGITransport instead of Starlette's TestClient so that async route
    handlers work correctly under pytest-asyncio's event loop.
    """
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

"""Unit tests for utilities/genreFunctions.py."""

import time
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from tests.helpers.mock_factories import make_anilist_genre_response, make_httpx_mock


# ---------------------------------------------------------------------------
# fetch_genres — raw HTTP layer
# ---------------------------------------------------------------------------

async def test_fetch_genres_success(monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_genre_response(["Action", "Drama"]))
    monkeypatch.setattr("utilities.genreFunctions.httpx.AsyncClient", mock_cls)

    from utilities.genreFunctions import fetch_genres
    result = await fetch_genres()
    assert "Action" in result
    assert "Drama" in result


async def test_fetch_genres_401_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException
    import utilities.genreFunctions as gf

    err_response = MagicMock()
    err_response.status_code = 401
    error = httpx.HTTPStatusError("Unauthorized", request=MagicMock(), response=err_response)

    mock_client = AsyncMock()
    mock_client.post.side_effect = error
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(gf, "httpx", MagicMock(
        AsyncClient=mock_cls,
        HTTPStatusError=httpx.HTTPStatusError,
        RequestError=httpx.RequestError,
        Timeout=httpx.Timeout,
    ))

    with pytest.raises(HTTPException) as exc_info:
        await gf.fetch_genres()
    assert exc_info.value.status_code == 503


async def test_fetch_genres_429_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException
    import utilities.genreFunctions as gf

    err_response = MagicMock()
    err_response.status_code = 429
    error = httpx.HTTPStatusError("Rate limited", request=MagicMock(), response=err_response)

    mock_client = AsyncMock()
    mock_client.post.side_effect = error
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(gf, "httpx", MagicMock(
        AsyncClient=mock_cls,
        HTTPStatusError=httpx.HTTPStatusError,
        RequestError=httpx.RequestError,
        Timeout=httpx.Timeout,
    ))

    with pytest.raises(HTTPException) as exc_info:
        await gf.fetch_genres()
    assert exc_info.value.status_code == 503


async def test_fetch_genres_500_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException
    import utilities.genreFunctions as gf

    err_response = MagicMock()
    err_response.status_code = 500
    error = httpx.HTTPStatusError("Server error", request=MagicMock(), response=err_response)

    mock_client = AsyncMock()
    mock_client.post.side_effect = error
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(gf, "httpx", MagicMock(
        AsyncClient=mock_cls,
        HTTPStatusError=httpx.HTTPStatusError,
        RequestError=httpx.RequestError,
        Timeout=httpx.Timeout,
    ))

    with pytest.raises(HTTPException) as exc_info:
        await gf.fetch_genres()
    assert exc_info.value.status_code == 503


async def test_fetch_genres_400_raises_502(monkeypatch):
    from fastapi.exceptions import HTTPException
    import utilities.genreFunctions as gf

    err_response = MagicMock()
    err_response.status_code = 400
    error = httpx.HTTPStatusError("Bad request", request=MagicMock(), response=err_response)

    mock_client = AsyncMock()
    mock_client.post.side_effect = error
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(gf, "httpx", MagicMock(
        AsyncClient=mock_cls,
        HTTPStatusError=httpx.HTTPStatusError,
        RequestError=httpx.RequestError,
        Timeout=httpx.Timeout,
    ))

    with pytest.raises(HTTPException) as exc_info:
        await gf.fetch_genres()
    assert exc_info.value.status_code == 502


async def test_fetch_genres_request_error_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException
    import utilities.genreFunctions as gf

    mock_client = AsyncMock()
    mock_client.post.side_effect = httpx.RequestError("Connection failed")

    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(gf, "httpx", MagicMock(
        AsyncClient=mock_cls,
        HTTPStatusError=httpx.HTTPStatusError,
        RequestError=httpx.RequestError,
        Timeout=httpx.Timeout,
    ))

    with pytest.raises(HTTPException) as exc_info:
        await gf.fetch_genres()
    assert exc_info.value.status_code == 503


# ---------------------------------------------------------------------------
# get_cached_genre — cache layer
# ---------------------------------------------------------------------------

async def test_get_cached_genre_calls_fetch_on_cold_cache(monkeypatch):
    import utilities.genreFunctions as gf

    fake_genres = ["Action", "Comedy"]
    mock_fetch = AsyncMock(return_value=fake_genres)
    monkeypatch.setattr(gf, "fetch_genres", mock_fetch)

    result = await gf.get_cached_genre()

    mock_fetch.assert_called_once()
    assert set(result) == set(fake_genres)


async def test_get_cached_genre_returns_cached_on_warm_cache(monkeypatch):
    import utilities.genreFunctions as gf

    fake_genres = ["Action", "Comedy"]
    mock_fetch = AsyncMock(return_value=fake_genres)
    monkeypatch.setattr(gf, "fetch_genres", mock_fetch)

    await gf.get_cached_genre()
    await gf.get_cached_genre()

    # fetch_genres should only be called once — second call uses the cache
    mock_fetch.assert_called_once()


async def test_get_cached_genre_refreshes_after_stale_timer(monkeypatch):
    import utilities.genreFunctions as gf

    fake_genres = ["Action"]
    mock_fetch = AsyncMock(return_value=fake_genres)
    monkeypatch.setattr(gf, "fetch_genres", mock_fetch)

    # Simulate an already-populated but stale cache
    gf._genre_cache = ["OldGenre"]
    gf._genre_cache_fetched_at = time.time() - gf.STALE_TIMER - 1

    result = await gf.get_cached_genre()

    mock_fetch.assert_called_once()
    assert result == sorted(set(fake_genres))


async def test_get_cached_genre_deduplicates_and_sorts(monkeypatch):
    import utilities.genreFunctions as gf

    mock_fetch = AsyncMock(return_value=["Drama", "Action", "Action", "Comedy"])
    monkeypatch.setattr(gf, "fetch_genres", mock_fetch)

    result = await gf.get_cached_genre()

    assert result == sorted({"Action", "Drama", "Comedy"})

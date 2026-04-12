"""Unit tests for utilities/anilist_client.py."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from tests.helpers.mock_factories import make_anilist_media_batch_response, make_httpx_mock


async def test_empty_ids_returns_empty_dict():
    from utilities.anilist_client import fetch_anilist_media_map

    result = await fetch_anilist_media_map([])
    assert result == {}


async def test_returns_cached_result_when_available(monkeypatch):
    import utilities.cache as cache_mod
    from utilities.anilist_client import _build_media_cache_key, fetch_anilist_media_map

    cached_value = {1: {"id": 1, "title": "cached"}}
    key = _build_media_cache_key([1])
    import time
    cache_mod._cache[key] = (time.time() + 3600, cached_value)

    # Patch httpx so we can verify it's never called
    mock_cls = MagicMock()
    monkeypatch.setattr("utilities.anilist_client.httpx.AsyncClient", mock_cls)

    result = await fetch_anilist_media_map([1])

    assert result == cached_value
    mock_cls.assert_not_called()


async def test_successful_fetch_returns_media_map(monkeypatch):
    from utilities.anilist_client import fetch_anilist_media_map

    mock_cls, _ = make_httpx_mock(make_anilist_media_batch_response([1, 2]))
    monkeypatch.setattr("utilities.anilist_client.httpx.AsyncClient", mock_cls)

    result = await fetch_anilist_media_map([1, 2])

    assert 1 in result
    assert 2 in result
    assert result[1]["id"] == 1


async def test_successful_fetch_calls_set_cache(monkeypatch):
    import utilities.cache as cache_mod
    from utilities.anilist_client import fetch_anilist_media_map

    mock_cls, _ = make_httpx_mock(make_anilist_media_batch_response([1]))
    monkeypatch.setattr("utilities.anilist_client.httpx.AsyncClient", mock_cls)

    await fetch_anilist_media_map([1])

    assert len(cache_mod._cache) == 1


async def test_deduplicates_input_ids(monkeypatch):
    from utilities.anilist_client import fetch_anilist_media_map

    mock_cls, mock_client = make_httpx_mock(make_anilist_media_batch_response([1]))
    monkeypatch.setattr("utilities.anilist_client.httpx.AsyncClient", mock_cls)

    await fetch_anilist_media_map([1, 1, 1])

    # Should only make one HTTP call, with deduplicated ids
    mock_client.post.assert_called_once()
    call_kwargs = mock_client.post.call_args
    variables = call_kwargs[1]["json"]["variables"]
    assert variables["ids"] == [1]


async def test_graphql_errors_raise_503(monkeypatch):
    from fastapi.exceptions import HTTPException
    from utilities.anilist_client import fetch_anilist_media_map
    from tests.helpers.mock_factories import make_anilist_error_response

    mock_cls, _ = make_httpx_mock(make_anilist_error_response("Not found"))
    monkeypatch.setattr("utilities.anilist_client.httpx.AsyncClient", mock_cls)

    with pytest.raises(HTTPException) as exc_info:
        await fetch_anilist_media_map([1])
    assert exc_info.value.status_code == 503


async def test_http_status_error_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException
    from utilities.anilist_client import fetch_anilist_media_map

    err_response = MagicMock()
    err_response.status_code = 503
    error = httpx.HTTPStatusError("Service unavailable", request=MagicMock(), response=err_response)

    mock_client = AsyncMock()
    mock_client.post.side_effect = error
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr("utilities.anilist_client.httpx.AsyncClient", mock_cls)

    with pytest.raises(HTTPException) as exc_info:
        await fetch_anilist_media_map([1])
    assert exc_info.value.status_code == 503


async def test_request_error_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException
    from utilities.anilist_client import fetch_anilist_media_map

    mock_client = AsyncMock()
    mock_client.post.side_effect = httpx.RequestError("Connection failed")
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr("utilities.anilist_client.httpx.AsyncClient", mock_cls)

    with pytest.raises(HTTPException) as exc_info:
        await fetch_anilist_media_map([1])
    assert exc_info.value.status_code == 503

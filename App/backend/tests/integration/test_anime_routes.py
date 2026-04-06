"""Integration tests for the anime router (/anime/*)."""

from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from tests.helpers.mock_factories import (
    make_anilist_page_response,
    make_anilist_error_response,
    make_httpx_mock,
)


def _make_httpx_error_mock(status_code: int):
    """Return a mock_cls that raises HTTPStatusError with the given status."""
    err_response = MagicMock()
    err_response.status_code = status_code
    error = httpx.HTTPStatusError("Error", request=MagicMock(), response=err_response)

    mock_client = AsyncMock()
    mock_client.post.side_effect = error
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    return mock_cls


# ---------------------------------------------------------------------------
# GET /anime/genres
# ---------------------------------------------------------------------------

async def test_get_genres_returns_200(async_client, monkeypatch):
    monkeypatch.setattr(
        "utilities.genreFunctions.fetch_genres",
        AsyncMock(return_value=["Action", "Drama"]),
    )
    response = await async_client.get("/anime/genres")
    assert response.status_code == 200


async def test_get_genres_response_has_genres_key(async_client, monkeypatch):
    monkeypatch.setattr(
        "utilities.genreFunctions.fetch_genres",
        AsyncMock(return_value=["Action", "Drama"]),
    )
    data = (await async_client.get("/anime/genres")).json()
    assert "genres" in data
    assert isinstance(data["genres"], list)


# ---------------------------------------------------------------------------
# GET /anime/seasons
# ---------------------------------------------------------------------------

async def test_get_seasons_returns_200(async_client):
    response = await async_client.get("/anime/seasons")
    assert response.status_code == 200


async def test_get_seasons_returns_four_seasons(async_client):
    data = (await async_client.get("/anime/seasons")).json()
    assert len(data["seasons"]) == 4
    assert set(data["seasons"]) == {"WINTER", "SPRING", "SUMMER", "FALL"}


# ---------------------------------------------------------------------------
# GET /anime/popular
# ---------------------------------------------------------------------------

async def test_get_popular_returns_200(async_client, monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/popular")
    assert response.status_code == 200


async def test_get_popular_uses_cache_on_second_call(async_client, monkeypatch):
    mock_cls, mock_client = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    await async_client.get("/anime/popular")
    await async_client.get("/anime/popular")

    # Second call should be served from cache, not hit AniList again
    assert mock_client.post.call_count == 1


async def test_get_popular_anilist_503_returns_503(async_client, monkeypatch):
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", _make_httpx_error_mock(503))
    response = await async_client.get("/anime/popular")
    assert response.status_code == 503


async def test_get_popular_anilist_429_returns_503(async_client, monkeypatch):
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", _make_httpx_error_mock(429))
    response = await async_client.get("/anime/popular")
    assert response.status_code == 503


# ---------------------------------------------------------------------------
# GET /anime/trending
# ---------------------------------------------------------------------------

async def test_get_trending_returns_200(async_client, monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/trending")
    assert response.status_code == 200


async def test_get_trending_uses_cache_on_second_call(async_client, monkeypatch):
    mock_cls, mock_client = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    await async_client.get("/anime/trending")
    await async_client.get("/anime/trending")

    assert mock_client.post.call_count == 1


# ---------------------------------------------------------------------------
# GET /anime/top
# ---------------------------------------------------------------------------

async def test_get_top_returns_200(async_client, monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/top")
    assert response.status_code == 200


async def test_get_top_uses_cache_on_second_call(async_client, monkeypatch):
    mock_cls, mock_client = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    await async_client.get("/anime/top")
    await async_client.get("/anime/top")

    assert mock_client.post.call_count == 1


# ---------------------------------------------------------------------------
# GET /anime/categories
# ---------------------------------------------------------------------------

async def test_get_categories_returns_200(async_client, monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/categories")
    assert response.status_code == 200


async def test_get_categories_with_search_param(async_client, monkeypatch):
    mock_cls, mock_client = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    await async_client.get("/anime/categories?search=naruto")

    call_json = mock_client.post.call_args[1]["json"]
    variables = call_json["variables"]
    assert variables.get("search") == "naruto"
    assert variables["sort"] == ["SEARCH_MATCH"]


async def test_get_categories_without_search_uses_popularity_sort(async_client, monkeypatch):
    mock_cls, mock_client = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    await async_client.get("/anime/categories")

    call_json = mock_client.post.call_args[1]["json"]
    assert call_json["variables"]["sort"] == ["POPULARITY_DESC"]


async def test_get_categories_uses_cache_on_same_params(async_client, monkeypatch):
    mock_cls, mock_client = make_httpx_mock(make_anilist_page_response())
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    await async_client.get("/anime/categories?search=naruto")
    await async_client.get("/anime/categories?search=naruto")

    assert mock_client.post.call_count == 1


async def test_get_categories_graphql_error_returns_502(async_client, monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_error_response("Some error"))
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/categories")
    assert response.status_code in {502, 503}


# ---------------------------------------------------------------------------
# GET /anime/{anime_id}
# ---------------------------------------------------------------------------

async def test_get_anime_by_id_returns_200(async_client, monkeypatch):
    mock_cls, _ = make_httpx_mock({"data": {"Media": {"id": 1}}})
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/1")
    assert response.status_code == 200


async def test_get_anime_by_id_uses_cache_on_second_call(async_client, monkeypatch):
    mock_cls, mock_client = make_httpx_mock({"data": {"Media": {"id": 1}}})
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    await async_client.get("/anime/1")
    await async_client.get("/anime/1")

    assert mock_client.post.call_count == 1


async def test_get_anime_by_id_non_integer_returns_422(async_client):
    response = await async_client.get("/anime/not-a-number")
    assert response.status_code == 422


async def test_get_anime_by_id_anilist_rate_limited_returns_503(async_client, monkeypatch):
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", _make_httpx_error_mock(429))
    response = await async_client.get("/anime/1")
    assert response.status_code == 503


async def test_get_anime_by_id_anilist_forbidden_graphql_returns_503(async_client, monkeypatch):
    mock_cls, _ = make_httpx_mock(
        {"errors": [{"message": "Forbidden", "extensions": {"code": "FORBIDDEN"}}]}
    )
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/1")
    assert response.status_code == 503


async def test_get_anime_by_id_request_error_returns_503(async_client, monkeypatch):
    mock_client = AsyncMock()
    mock_client.post.side_effect = httpx.RequestError("Connection failed")
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)

    response = await async_client.get("/anime/1")
    assert response.status_code == 503

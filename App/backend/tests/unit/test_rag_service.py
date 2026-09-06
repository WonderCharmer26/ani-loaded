"""Deterministic tests for recommendation retrieval and filtering.

These tests mock OpenAI and Supabase, so they make no network calls and do
not consume model tokens.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from rag.rag_service import get_filtered_recommendations, search_similar_anime


def _anime_row(anime_id: int, title: str) -> dict:
    return {
        "id": anime_id,
        "title": title,
        "genres": ["Action"],
        "description": "A test description.",
        "average_score": 80,
        "cover_url": "https://example.com/cover.jpg",
        "similarity": 0.9,
    }


@pytest.mark.asyncio
async def test_search_similar_anime_uses_callers_jwt(monkeypatch):
    openai = MagicMock()
    openai.embeddings.create = AsyncMock(
        return_value=SimpleNamespace(data=[SimpleNamespace(embedding=[0.1, 0.2])])
    )
    supabase = MagicMock()
    supabase.rpc.return_value.execute = AsyncMock(
        return_value=SimpleNamespace(data=[_anime_row(1, "Test Anime")])
    )
    get_client = AsyncMock(return_value=supabase)

    monkeypatch.setattr("rag.rag_service.get_openai_client", lambda: openai)
    monkeypatch.setattr("rag.rag_service.get_supabase_client", get_client)

    results = await search_similar_anime(
        "action anime like Naruto",
        authorization="Bearer signed-in-jwt",
    )

    get_client.assert_awaited_once_with("Bearer signed-in-jwt")
    supabase.rpc.assert_called_once_with(
        "match_anime",
        {"query_embedding": [0.1, 0.2], "match_count": 10},
    )
    assert [result.title for result in results] == ["Test Anime"]


@pytest.mark.asyncio
async def test_search_similar_anime_validates_rpc_rows(monkeypatch):
    openai = MagicMock()
    openai.embeddings.create = AsyncMock(
        return_value=SimpleNamespace(data=[SimpleNamespace(embedding=[0.1])])
    )
    supabase = MagicMock()
    supabase.rpc.return_value.execute = AsyncMock(
        return_value=SimpleNamespace(data=[{"id": 1, "title": "Incomplete row"}])
    )

    monkeypatch.setattr("rag.rag_service.get_openai_client", lambda: openai)
    monkeypatch.setattr(
        "rag.rag_service.get_supabase_client", AsyncMock(return_value=supabase)
    )

    with pytest.raises(ValidationError):
        await search_similar_anime("test query", authorization="Bearer jwt")


@pytest.mark.asyncio
async def test_filtered_recommendations_passes_jwt_and_removes_completed(monkeypatch):
    search = AsyncMock(
        return_value=[
            SimpleNamespace(id=1, title="Already Watched"),
            SimpleNamespace(id=2, title="New Recommendation"),
        ]
    )
    completed = AsyncMock(return_value=[1])

    monkeypatch.setattr("rag.rag_service.search_similar_anime", search)
    monkeypatch.setattr("rag.rag_service.get_completed_watchlist", completed)

    results = await get_filtered_recommendations(
        "user-1",
        "action anime",
        match_count=5,
        authorization="Bearer signed-in-jwt",
    )

    search.assert_awaited_once_with("action anime", 5, "Bearer signed-in-jwt")
    completed.assert_awaited_once_with("user-1", "Bearer signed-in-jwt")
    assert [result.id for result in results] == [2]


@pytest.mark.asyncio
async def test_filtered_recommendations_returns_all_when_watchlist_empty(monkeypatch):
    candidates = [SimpleNamespace(id=1, title="Recommendation")]
    monkeypatch.setattr(
        "rag.rag_service.search_similar_anime", AsyncMock(return_value=candidates)
    )
    monkeypatch.setattr(
        "rag.rag_service.get_completed_watchlist", AsyncMock(return_value=[])
    )

    results = await get_filtered_recommendations("user-1", "comedy")

    assert results == candidates

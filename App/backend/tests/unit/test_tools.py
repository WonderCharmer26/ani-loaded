"""Tests for recommendation agent tool auth injection."""

from unittest.mock import AsyncMock

import pytest

from agents.tools import (
    get_completed_watchlist,
    get_users_whole_watchlist,
    search_similar_anime,
)


def test_authorization_is_hidden_from_model_tool_schema():
    for agent_tool in (
        search_similar_anime,
        get_users_whole_watchlist,
        get_completed_watchlist,
    ):
        assert "authorization" not in agent_tool.args
        assert "authorization" not in agent_tool.tool_call_schema.model_json_schema()[
            "properties"
        ]


@pytest.mark.asyncio
async def test_search_similar_anime_forwards_injected_authorization(monkeypatch):
    rag_search = AsyncMock(return_value=[])
    monkeypatch.setattr("agents.tools.rag_search_similar_anime", rag_search)

    await search_similar_anime.ainvoke(
        {
            "query": "dark psychological thriller",
            "match_count": 5,
            "authorization": "Bearer signed-in-jwt",
        }
    )

    rag_search.assert_awaited_once_with(
        "dark psychological thriller", 5, authorization="Bearer signed-in-jwt"
    )


@pytest.mark.asyncio
async def test_watchlist_tools_forward_injected_authorization(monkeypatch):
    rag_whole_watchlist = AsyncMock(return_value=[])
    rag_completed_watchlist = AsyncMock(return_value=[])
    monkeypatch.setattr(
        "agents.tools.rag_get_users_whole_watchlist", rag_whole_watchlist
    )
    monkeypatch.setattr(
        "agents.tools.rag_get_completed_watchlist", rag_completed_watchlist
    )

    await get_users_whole_watchlist.ainvoke(
        {"user_id": "user-1", "authorization": "Bearer signed-in-jwt"}
    )
    await get_completed_watchlist.ainvoke(
        {"user_id": "user-1", "authorization": "Bearer signed-in-jwt"}
    )

    rag_whole_watchlist.assert_awaited_once_with(
        "user-1", authorization="Bearer signed-in-jwt"
    )
    rag_completed_watchlist.assert_awaited_once_with(
        "user-1", authorization="Bearer signed-in-jwt"
    )

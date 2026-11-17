"""Unit tests for helper functions in routers/discussions.py."""

from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from routers.discussions import _call_maybe_async, normalize_optional_text, validate_anime_exists
from tests.helpers.mock_factories import (
    make_anilist_single_media_response,
    make_anilist_error_response,
    make_httpx_mock,
)


# ---------------------------------------------------------------------------
# normalize_optional_text
# ---------------------------------------------------------------------------

def test_normalize_none_returns_none():
    assert normalize_optional_text(None) is None


def test_normalize_empty_string_returns_none():
    assert normalize_optional_text("") is None


def test_normalize_whitespace_only_returns_none():
    assert normalize_optional_text("   ") is None


def test_normalize_strips_leading_trailing_whitespace():
    assert normalize_optional_text("  hello  ") == "hello"


def test_normalize_normal_string_passes_through():
    assert normalize_optional_text("Action") == "Action"


def test_normalize_preserves_internal_spaces():
    assert normalize_optional_text("  Attack on Titan  ") == "Attack on Titan"


# ---------------------------------------------------------------------------
# _call_maybe_async
# ---------------------------------------------------------------------------

async def test_call_maybe_async_with_sync_function():
    results = []

    def sync_func(x, y):
        results.append((x, y))
        return x + y

    result = await _call_maybe_async(sync_func, 1, 2)
    assert result == 3
    assert results == [(1, 2)]


async def test_call_maybe_async_with_async_function():
    async def async_func(x):
        return x * 2

    result = await _call_maybe_async(async_func, 5)
    assert result == 10


async def test_call_maybe_async_passes_kwargs():
    async def async_func(a, b=0):
        return a + b

    result = await _call_maybe_async(async_func, 3, b=7)
    assert result == 10


# ---------------------------------------------------------------------------
# validate_anime_exists
# ---------------------------------------------------------------------------

async def test_validate_anime_exists_valid_returns_true(monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_single_media_response(anime_id=1))
    monkeypatch.setattr("routers.discussions.httpx.AsyncClient", mock_cls)

    result = await validate_anime_exists(1)
    assert result is True


async def test_validate_anime_not_found_returns_false(monkeypatch):
    mock_cls, _ = make_httpx_mock(make_anilist_error_response("Not Found"))
    monkeypatch.setattr("routers.discussions.httpx.AsyncClient", mock_cls)

    result = await validate_anime_exists(99999)
    assert result is False


async def test_validate_anime_media_is_none_returns_false(monkeypatch):
    mock_cls, _ = make_httpx_mock({"data": {"Media": None}})
    monkeypatch.setattr("routers.discussions.httpx.AsyncClient", mock_cls)

    result = await validate_anime_exists(1)
    assert result is False


async def test_validate_anime_http_status_error_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException

    err_response = MagicMock()
    err_response.status_code = 503

    mock_client = AsyncMock()
    mock_client.post.side_effect = httpx.HTTPStatusError(
        "Error", request=MagicMock(), response=err_response
    )
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr("routers.discussions.httpx.AsyncClient", mock_cls)

    with pytest.raises(HTTPException) as exc_info:
        await validate_anime_exists(1)
    assert exc_info.value.status_code == 503


async def test_validate_anime_request_error_raises_503(monkeypatch):
    from fastapi.exceptions import HTTPException

    mock_client = AsyncMock()
    mock_client.post.side_effect = httpx.RequestError("Connection failed")
    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr("routers.discussions.httpx.AsyncClient", mock_cls)

    with pytest.raises(HTTPException) as exc_info:
        await validate_anime_exists(1)
    assert exc_info.value.status_code == 503


# ---------------------------------------------------------------------------
# attach_discussion_authors
# ---------------------------------------------------------------------------

from routers.discussions import (  # noqa: E402
    attach_comment_authors,
    attach_discussion_authors,
    public_discussion,
)
from tests.helpers.mock_factories import (  # noqa: E402
    make_discussion_row,
    make_supabase_builder,
)


def test_public_discussion_omits_owner_id_and_reports_viewer_ownership():
    result = public_discussion(make_discussion_row(created_by="user-1"), "user-1")

    assert "created_by" not in result
    assert result["is_author"] is True


async def test_attach_authors_adds_username_and_avatar():
    row = make_discussion_row(created_by="user-1")
    builder = make_supabase_builder(
        execute_data=[
            {"user_id": "user-1", "username": "MechaMuse", "avatar_url": "https://a/b.png"}
        ]
    )

    [result] = await attach_discussion_authors(builder, [row])

    assert result["author_username"] == "MechaMuse"
    assert result["author_avatar_url"] == "https://a/b.png"
    builder.rpc.assert_called_once_with(
        "get_public_profiles", {"profile_ids": ["user-1"]}
    )


async def test_attach_authors_missing_profile_returns_none_fields():
    row = make_discussion_row(created_by="user-2")
    builder = make_supabase_builder(execute_data=[])

    [result] = await attach_discussion_authors(builder, [row])

    assert result["author_username"] is None
    assert result["author_avatar_url"] is None


async def test_attach_authors_profile_error_does_not_raise():
    row = make_discussion_row(created_by="user-3")
    builder = make_supabase_builder()
    builder.execute.side_effect = RuntimeError("profiles blocked")

    [result] = await attach_discussion_authors(builder, [row])

    assert result["id"] == row["id"]
    assert result["author_username"] is None


async def test_attach_authors_empty_list_skips_query():
    builder = make_supabase_builder()

    assert await attach_discussion_authors(builder, []) == []
    builder.execute.assert_not_called()


async def test_attach_comment_authors_uses_current_profile_fields():
    builder = make_supabase_builder(
        execute_data=[
            {
                "user_id": "user-1",
                "username": "RenamedUser",
                "avatar_url": "https://a/current.png",
            }
        ]
    )
    comments = [{"id": "comment-1", "created_by": "user-1"}]

    [result] = await attach_comment_authors(builder, comments)

    assert result["created_by_username"] == "RenamedUser"
    assert result["created_by_avatar_url"] == "https://a/current.png"

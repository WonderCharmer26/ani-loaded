"""Integration tests for the discussions router."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.helpers.mock_factories import (
    make_discussion_row,
    make_comment_row,
    make_fake_user,
    make_supabase_builder,
    make_supabase_response,
    make_httpx_mock,
    make_anilist_single_media_response,
)


# ---------------------------------------------------------------------------
# GET /discussions
# ---------------------------------------------------------------------------

async def test_get_discussions_returns_200(async_client, monkeypatch):
    builder = make_supabase_builder(execute_data=[make_discussion_row()])
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/discussions")
    assert response.status_code == 200


async def test_get_discussions_returns_data_and_total(async_client, monkeypatch):
    rows = [make_discussion_row(), make_discussion_row(id="00000000-0000-0000-0000-000000000099")]
    builder = make_supabase_builder(execute_data=rows)
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    data = (await async_client.get("/discussions")).json()
    assert "data" in data
    assert data["total"] == 2


async def test_get_discussions_empty_table_returns_empty_list(async_client, monkeypatch):
    builder = make_supabase_builder(execute_data=[])
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    data = (await async_client.get("/discussions")).json()
    assert data["data"] == []
    assert data["total"] == 0


# ---------------------------------------------------------------------------
# GET /discussions/{discussion_id}
# ---------------------------------------------------------------------------

async def test_get_discussion_by_id_returns_200(async_client, monkeypatch):
    builder = make_supabase_builder(execute_data=make_discussion_row())
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/discussions/disc-uuid-1")
    assert response.status_code == 200


async def test_get_discussion_by_id_not_found_returns_404(async_client, monkeypatch):
    # The route converts PGRST116 (Supabase "not found" for .single()) to 404
    class _PGRST116Error(Exception):
        code = "PGRST116"

    builder = make_supabase_builder()
    builder.execute.side_effect = _PGRST116Error("Not found")
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/discussions/nonexistent-id")
    assert response.status_code == 404


async def test_get_discussion_by_id_supabase_error_returns_500(async_client, monkeypatch):
    builder = make_supabase_builder()
    builder.execute.side_effect = Exception("DB error")
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/discussions/some-id")
    assert response.status_code == 500


# ---------------------------------------------------------------------------
# GET /discussions/{discussion_id}/comments
# ---------------------------------------------------------------------------

async def test_get_discussion_comments_returns_200(async_client, monkeypatch):
    builder = make_supabase_builder(execute_data=[make_comment_row()])
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/discussions/disc-uuid-1/comments")
    assert response.status_code == 200


async def test_get_discussion_comments_returns_data_and_total(async_client, monkeypatch):
    rows = [make_comment_row(), make_comment_row(id="comment-uuid-2")]
    builder = make_supabase_builder(execute_data=rows)
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    data = (await async_client.get("/discussions/disc-uuid-1/comments")).json()
    assert data["total"] == 2


async def test_get_discussion_comments_empty_returns_zero_total(async_client, monkeypatch):
    builder = make_supabase_builder(execute_data=[])
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    data = (await async_client.get("/discussions/disc-uuid-1/comments")).json()
    assert data["total"] == 0


async def test_get_discussion_comments_supabase_error_returns_500(async_client, monkeypatch):
    builder = make_supabase_builder()
    builder.execute.side_effect = Exception("DB error")
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/discussions/disc-uuid-1/comments")
    assert response.status_code == 500


# ---------------------------------------------------------------------------
# POST /discussion
# ---------------------------------------------------------------------------

def _base_form_data():
    return {
        "anime_id": "1",
        "category_id": "cat-1",
        "title": "Test Discussion",
        "body": "This is the body.",
        "is_spoiler": "false",
        "is_locked": "false",
    }


async def test_post_discussion_missing_auth_returns_422(async_client):
    # No Authorization header at all → FastAPI returns 422 (required header missing)
    response = await async_client.post("/discussion", data=_base_form_data())
    assert response.status_code == 422


async def test_post_discussion_invalid_token_returns_401(async_client, monkeypatch):
    from fastapi.exceptions import HTTPException

    monkeypatch.setattr(
        "routers.discussions.auth_validator",
        AsyncMock(side_effect=HTTPException(status_code=401, detail="Invalid token")),
    )
    monkeypatch.setattr(
        "routers.discussions.validate_anime_exists", AsyncMock(return_value=True)
    )

    response = await async_client.post(
        "/discussion",
        data=_base_form_data(),
        headers={"Authorization": "Bearer bad-token"},
    )
    assert response.status_code == 401


async def test_post_discussion_negative_anime_id_returns_422(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    builder = make_supabase_builder(execute_data=None)
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    form = {**_base_form_data(), "anime_id": "-1"}
    response = await async_client.post(
        "/discussion", data=form, headers={"Authorization": "Bearer token"}
    )
    assert response.status_code == 422


async def test_post_discussion_zero_anime_id_returns_422(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    builder = make_supabase_builder(execute_data=None)
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    form = {**_base_form_data(), "anime_id": "0"}
    response = await async_client.post(
        "/discussion", data=form, headers={"Authorization": "Bearer token"}
    )
    assert response.status_code == 422


async def test_post_discussion_invalid_anime_returns_422(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.discussions.validate_anime_exists", AsyncMock(return_value=False)
    )
    builder = make_supabase_builder(execute_data=None)
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.post(
        "/discussion", data=_base_form_data(), headers={"Authorization": "Bearer token"}
    )
    assert response.status_code == 422


async def test_post_discussion_no_thumbnail_success(async_client, monkeypatch):
    fake_user = make_fake_user()
    fake_discussion = make_discussion_row()

    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.discussions.validate_anime_exists", AsyncMock(return_value=True)
    )

    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response(None),            # anime upsert
            make_supabase_response([fake_discussion]),  # discussion insert
        ]
    )
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.post(
        "/discussion", data=_base_form_data(), headers={"Authorization": "Bearer token"}
    )
    assert response.status_code == 200
    assert "discussion" in response.json()


async def test_post_discussion_thumbnail_wrong_content_type_returns_415(
    async_client, monkeypatch
):
    fake_user = make_fake_user()
    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.discussions.validate_anime_exists", AsyncMock(return_value=True)
    )
    builder = make_supabase_builder(execute_data=None)
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.post(
        "/discussion",
        data=_base_form_data(),
        files={"thumbnail": ("anim.gif", b"GIF89a...", "image/gif")},
        headers={"Authorization": "Bearer token"},
    )
    assert response.status_code == 415


async def test_post_discussion_thumbnail_too_large_returns_413(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.discussions.validate_anime_exists", AsyncMock(return_value=True)
    )
    builder = make_supabase_builder(execute_data=None)
    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    big_file = b"x" * (5 * 1024 * 1024 + 1)  # 5 MB + 1 byte
    response = await async_client.post(
        "/discussion",
        data=_base_form_data(),
        files={"thumbnail": ("big.png", big_file, "image/png")},
        headers={"Authorization": "Bearer token"},
    )
    assert response.status_code == 413


async def test_post_discussion_with_thumbnail_success(async_client, monkeypatch):
    fake_user = make_fake_user()
    fake_discussion = make_discussion_row(thumbnail_url="https://example.com/thumb.png")

    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.discussions.validate_anime_exists", AsyncMock(return_value=True)
    )

    # Mock storage bucket
    bucket = MagicMock()
    bucket.upload = MagicMock(return_value={"Key": "threads/abc.png"})
    bucket.get_public_url = MagicMock(return_value="https://example.com/thumb.png")

    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response(None),               # anime upsert
            make_supabase_response([fake_discussion]),  # discussion insert
        ]
    )
    builder.storage = MagicMock()
    builder.storage.from_.return_value = bucket

    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.post(
        "/discussion",
        data=_base_form_data(),
        files={"thumbnail": ("thumb.png", b"\x89PNG\r\n", "image/png")},
        headers={"Authorization": "Bearer token"},
    )
    assert response.status_code == 200


async def test_post_discussion_db_insert_failure_removes_uploaded_thumbnail(
    async_client, monkeypatch
):
    fake_user = make_fake_user()
    monkeypatch.setattr(
        "routers.discussions.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.discussions.validate_anime_exists", AsyncMock(return_value=True)
    )

    bucket = MagicMock()
    bucket.upload = MagicMock(return_value={"Key": "threads/abc.png"})
    bucket.get_public_url = MagicMock(return_value="https://example.com/t.png")
    bucket.remove = MagicMock(return_value=None)

    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response(None),  # anime upsert succeeds
            Exception("DB insert failed"),  # discussion insert fails
        ]
    )
    builder.storage = MagicMock()
    builder.storage.from_.return_value = bucket

    monkeypatch.setattr(
        "routers.discussions.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.post(
        "/discussion",
        data=_base_form_data(),
        files={"thumbnail": ("thumb.png", b"\x89PNG\r\n", "image/png")},
        headers={"Authorization": "Bearer token"},
    )
    assert response.status_code == 500
    # Verify storage cleanup was attempted
    bucket.remove.assert_called_once()

"""Integration tests for the lists router."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.helpers.mock_factories import (
    make_fake_user,
    make_list_row,
    make_anilist_media_item,
    make_supabase_builder,
    make_supabase_response,
)


def _auth_headers(token: str = "test-token") -> dict:
    return {"Authorization": f"Bearer {token}"}


def _make_list_row_no_owner_id(**overrides):
    """List row without owner_id, suitable for responses after normalize_owner_username."""
    row = make_list_row(**overrides)
    row.pop("owner_id", None)
    return row


# ---------------------------------------------------------------------------
# GET /lists
# ---------------------------------------------------------------------------

async def test_get_all_lists_returns_200(async_client, monkeypatch):
    list_row = make_list_row()

    builder = make_supabase_builder(execute_data=[list_row])
    # normalize_owner_username calls supabase for profiles
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response([list_row]),  # user_list query
            make_supabase_response(           # profiles query
                [{"user_id": "user-uuid-1", "username": "testuser"}]
            ),
        ]
    )
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )
    monkeypatch.setattr(
        "routers.lists.fetch_anilist_media_map",
        AsyncMock(return_value={1: make_anilist_media_item(1)}),
    )

    response = await async_client.get("/lists")
    assert response.status_code == 200


async def test_get_all_lists_empty_returns_404(async_client, monkeypatch):
    builder = make_supabase_builder(execute_data=[])
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/lists")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /list/{list_id}
# ---------------------------------------------------------------------------

async def test_get_specific_list_public_no_auth_returns_200(async_client, monkeypatch):
    list_row = make_list_row(visibility="public")

    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response([list_row]),  # user_list query
            make_supabase_response(           # profiles query (normalize_owner_username)
                [{"user_id": "user-uuid-1", "username": "testuser"}]
            ),
        ]
    )
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )
    monkeypatch.setattr(
        "routers.lists.fetch_anilist_media_map",
        AsyncMock(return_value={1: make_anilist_media_item(1)}),
    )

    response = await async_client.get("/list/list-uuid-1")
    assert response.status_code == 200


async def test_get_specific_list_not_found_returns_404(async_client, monkeypatch):
    builder = make_supabase_builder(execute_data=[])
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/list/nonexistent-id")
    assert response.status_code == 404


async def test_get_specific_list_private_no_auth_returns_403(async_client, monkeypatch):
    list_row = make_list_row(visibility="private")

    builder = make_supabase_builder(execute_data=[list_row])
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get("/list/list-uuid-1")
    assert response.status_code == 403


async def test_get_specific_list_private_with_owner_returns_200(async_client, monkeypatch):
    fake_user = make_fake_user(user_id="owner-id")
    list_row = make_list_row(visibility="private", owner_id="owner-id")

    monkeypatch.setattr(
        "routers.lists.auth_validator", AsyncMock(return_value=fake_user)
    )
    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response([list_row]),
            make_supabase_response([{"user_id": "owner-id", "username": "owner"}]),
        ]
    )
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )
    monkeypatch.setattr(
        "routers.lists.fetch_anilist_media_map",
        AsyncMock(return_value={1: make_anilist_media_item(1)}),
    )

    response = await async_client.get("/list/list-uuid-1", headers=_auth_headers())
    assert response.status_code == 200


async def test_get_specific_list_is_owner_flag_true_for_owner(async_client, monkeypatch):
    fake_user = make_fake_user(user_id="owner-id")
    list_row = make_list_row(visibility="public", owner_id="owner-id")

    monkeypatch.setattr(
        "routers.lists.auth_validator", AsyncMock(return_value=fake_user)
    )
    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response([list_row]),
            make_supabase_response([{"user_id": "owner-id", "username": "owner"}]),
        ]
    )
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )
    monkeypatch.setattr(
        "routers.lists.fetch_anilist_media_map",
        AsyncMock(return_value={1: make_anilist_media_item(1)}),
    )

    data = (
        await async_client.get("/list/list-uuid-1", headers=_auth_headers())
    ).json()
    assert data["is_owner"] is True


async def test_get_specific_list_is_owner_flag_false_for_non_owner(async_client, monkeypatch):
    fake_user = make_fake_user(user_id="other-user-id")
    list_row = make_list_row(visibility="public", owner_id="owner-id")

    monkeypatch.setattr(
        "routers.lists.auth_validator", AsyncMock(return_value=fake_user)
    )
    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response([list_row]),
            make_supabase_response([{"user_id": "owner-id", "username": "owner"}]),
        ]
    )
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )
    monkeypatch.setattr(
        "routers.lists.fetch_anilist_media_map",
        AsyncMock(return_value={1: make_anilist_media_item(1)}),
    )

    data = (
        await async_client.get("/list/list-uuid-1", headers=_auth_headers())
    ).json()
    assert data["is_owner"] is False


# ---------------------------------------------------------------------------
# PATCH /list/{list_id}
# ---------------------------------------------------------------------------

async def test_patch_list_missing_auth_returns_422(async_client):
    payload = {"list_data": {"title": "New Title"}, "entries": []}
    response = await async_client.patch("/list/list-uuid-1", json=payload)
    assert response.status_code == 422


async def test_patch_list_success_returns_200(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr("routers.lists.auth_validator", AsyncMock(return_value=fake_user))

    builder = make_supabase_builder(execute_data=None)
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    payload = {
        "list_data": {"title": "Updated Title", "description": None},
        "entries": [{"anime_id": 1, "rank": 1}],
    }
    response = await async_client.patch(
        "/list/list-uuid-1", json=payload, headers=_auth_headers()
    )
    assert response.status_code == 200
    assert "message" in response.json()


async def test_patch_list_supabase_error_returns_500(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr("routers.lists.auth_validator", AsyncMock(return_value=fake_user))

    builder = make_supabase_builder()
    builder.execute.side_effect = Exception("RPC error")
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    payload = {"list_data": {"title": None, "description": None}, "entries": []}
    response = await async_client.patch(
        "/list/list-uuid-1", json=payload, headers=_auth_headers()
    )
    assert response.status_code == 500


# ---------------------------------------------------------------------------
# DELETE /list/{list_id}
# ---------------------------------------------------------------------------

async def test_delete_list_missing_auth_returns_422(async_client):
    response = await async_client.delete("/list/list-uuid-1")
    assert response.status_code == 422


async def test_delete_list_success_returns_200(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr("routers.lists.auth_validator", AsyncMock(return_value=fake_user))

    builder = make_supabase_builder(execute_data=[{"id": "list-uuid-1"}])
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.delete("/list/list-uuid-1", headers=_auth_headers())
    assert response.status_code == 200
    assert "message" in response.json()


async def test_delete_list_not_found_returns_404(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr("routers.lists.auth_validator", AsyncMock(return_value=fake_user))

    builder = make_supabase_builder(execute_data=[])
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.delete("/list/nonexistent-id", headers=_auth_headers())
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /create-list
# ---------------------------------------------------------------------------

def _create_list_payload():
    return {
        "title": "My New List",
        "visibility": "public",
        "amount": 1,
        "entries": [{"anime_id": 1, "rank": 1}],
    }


async def test_create_list_missing_auth_returns_422(async_client):
    response = await async_client.post("/create-list", json=_create_list_payload())
    assert response.status_code == 422


async def test_create_list_invalid_anime_returns_404(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr("routers.lists.auth_validator", AsyncMock(return_value=fake_user))
    monkeypatch.setattr(
        "routers.lists.validate_anime_exists", AsyncMock(return_value=False)
    )

    builder = make_supabase_builder(execute_data=None)
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.post(
        "/create-list", json=_create_list_payload(), headers=_auth_headers()
    )
    assert response.status_code == 404


async def test_create_list_success_returns_200(async_client, monkeypatch):
    fake_user = make_fake_user(user_id="user-uuid-1")
    monkeypatch.setattr("routers.lists.auth_validator", AsyncMock(return_value=fake_user))
    monkeypatch.setattr(
        "routers.lists.validate_anime_exists", AsyncMock(return_value=True)
    )

    created_list = {
        "id": "00000000-0000-0000-0000-000000000030",
        "title": "My New List",
        "genre": None,
        "description": None,
        "visibility": "public",
        "amount": 1,
        "owner_id": "00000000-0000-0000-0000-000000000003",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
    }
    created_entry = {
        "id": "00000000-0000-0000-0000-000000000040",
        "list_id": "00000000-0000-0000-0000-000000000030",
        "anime_id": 1,
        "rank": 1,
        "genre": None,
        "created_at": "2024-01-01T00:00:00",
    }

    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response(None),              # anime upsert
            make_supabase_response([created_list]),    # user_list insert
            make_supabase_response([created_entry]),   # user_list_entry insert
            make_supabase_response(None),              # profiles query (fails gracefully)
        ]
    )
    monkeypatch.setattr(
        "routers.lists.get_supabase_client", AsyncMock(return_value=builder)
    )
    monkeypatch.setattr(
        "routers.lists.fetch_anilist_media_map",
        AsyncMock(return_value={1: make_anilist_media_item(1)}),
    )

    response = await async_client.post(
        "/create-list", json=_create_list_payload(), headers=_auth_headers()
    )
    assert response.status_code == 200
    assert "list" in response.json()


# ---------------------------------------------------------------------------
# GET /user-lists and GET /popular-lists (stub routes)
# ---------------------------------------------------------------------------

async def test_user_lists_with_auth_returns_200(async_client, monkeypatch):
    fake_user = make_fake_user()
    monkeypatch.setattr("routers.lists.auth_validator", AsyncMock(return_value=fake_user))

    response = await async_client.get("/user-lists", headers=_auth_headers())
    assert response.status_code == 200


async def test_popular_lists_returns_200(async_client):
    response = await async_client.get("/popular-lists")
    assert response.status_code == 200

"""Unit tests for helper functions in routers/lists.py."""

from unittest.mock import AsyncMock, MagicMock

from routers.lists import attach_anime_to_list_entries, normalize_owner_username
from tests.helpers.mock_factories import make_anilist_media_item, make_supabase_response


# ---------------------------------------------------------------------------
# attach_anime_to_list_entries
# ---------------------------------------------------------------------------

async def test_attach_anime_empty_list_returns_empty(monkeypatch):
    mock_fetch = AsyncMock(return_value={})
    monkeypatch.setattr("routers.lists.fetch_anilist_media_map", mock_fetch)

    result = await attach_anime_to_list_entries([])
    assert result == []
    mock_fetch.assert_not_called()


async def test_attach_anime_hydrates_entries(monkeypatch):
    media_item = make_anilist_media_item(anime_id=1)
    mock_fetch = AsyncMock(return_value={1: media_item})
    monkeypatch.setattr("routers.lists.fetch_anilist_media_map", mock_fetch)

    list_rows = [
        {
            "id": "list-1",
            "user_list_entry": [{"anime_id": 1, "rank": 1}],
        }
    ]

    result = await attach_anime_to_list_entries(list_rows)
    assert result[0]["user_list_entry"][0]["anime"] == media_item


async def test_attach_anime_missing_from_media_map_sets_none(monkeypatch):
    mock_fetch = AsyncMock(return_value={})  # empty map — anime not found
    monkeypatch.setattr("routers.lists.fetch_anilist_media_map", mock_fetch)

    list_rows = [
        {
            "id": "list-1",
            "user_list_entry": [{"anime_id": 99, "rank": 1}],
        }
    ]

    result = await attach_anime_to_list_entries(list_rows)
    assert result[0]["user_list_entry"][0]["anime"] is None


async def test_attach_anime_deduplicates_ids_before_fetch(monkeypatch):
    mock_fetch = AsyncMock(return_value={1: make_anilist_media_item(1)})
    monkeypatch.setattr("routers.lists.fetch_anilist_media_map", mock_fetch)

    # Two list rows both referencing the same anime
    list_rows = [
        {"id": "list-1", "user_list_entry": [{"anime_id": 1, "rank": 1}]},
        {"id": "list-2", "user_list_entry": [{"anime_id": 1, "rank": 2}]},
    ]

    await attach_anime_to_list_entries(list_rows)

    # fetch_anilist_media_map should be called with [1] — deduplicated
    call_args = mock_fetch.call_args[0][0]
    assert call_args.count(1) == 1


async def test_attach_anime_skips_entries_without_anime_id(monkeypatch):
    mock_fetch = AsyncMock(return_value={})
    monkeypatch.setattr("routers.lists.fetch_anilist_media_map", mock_fetch)

    list_rows = [
        {
            "id": "list-1",
            "user_list_entry": [{"anime_id": None, "rank": 1}],
        }
    ]

    result = await attach_anime_to_list_entries(list_rows)
    # When all anime_ids are None, the function returns early without touching entries
    mock_fetch.assert_not_called()
    assert "anime" not in result[0]["user_list_entry"][0]


# ---------------------------------------------------------------------------
# normalize_owner_username
# ---------------------------------------------------------------------------

async def test_normalize_owner_empty_list():
    supabase = MagicMock()
    result = await normalize_owner_username([], supabase)
    assert result == []


def _make_profiles_builder(profile_data):
    """Sync fluent builder with async execute — mirrors the Supabase API."""
    mock_response = make_supabase_response(profile_data)
    builder = MagicMock()
    builder.table.return_value = builder
    builder.select.return_value = builder
    builder.in_.return_value = builder
    builder.execute = AsyncMock(return_value=mock_response)
    return builder


async def test_normalize_owner_adds_username():
    profile_data = [{"user_id": "user-1", "username": "alice"}]
    supabase = _make_profiles_builder(profile_data)

    list_rows = [{"id": "list-1", "owner_id": "user-1", "title": "My List"}]
    result = await normalize_owner_username(list_rows, supabase)

    assert result[0]["owner_username"] == "alice"


async def test_normalize_owner_unknown_for_missing_profile():
    supabase = _make_profiles_builder([])

    list_rows = [{"id": "list-1", "owner_id": "unknown-user", "title": "My List"}]
    result = await normalize_owner_username(list_rows, supabase)

    assert result[0]["owner_username"] == "Unknown"


async def test_normalize_owner_removes_owner_id():
    profile_data = [{"user_id": "user-1", "username": "bob"}]
    supabase = _make_profiles_builder(profile_data)

    list_rows = [{"id": "list-1", "owner_id": "user-1"}]
    result = await normalize_owner_username(list_rows, supabase)

    assert "owner_id" not in result[0]

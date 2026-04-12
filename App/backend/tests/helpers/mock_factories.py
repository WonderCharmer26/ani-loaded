"""Factory functions for building fake data used across tests.

These are plain functions (not fixtures) so they can be called inline in any
test or fixture without registering them with pytest.
"""

from unittest.mock import AsyncMock, MagicMock


# ---------------------------------------------------------------------------
# User / auth
# ---------------------------------------------------------------------------

def make_fake_user(user_id: str = "00000000-0000-0000-0000-000000000003", email: str = "test@example.com"):
    """Return a MagicMock shaped like a gotrue.types.User object."""
    user = MagicMock()
    user.id = user_id
    user.email = email
    return user


# ---------------------------------------------------------------------------
# AniList payloads
# ---------------------------------------------------------------------------

def make_anilist_media_item(anime_id: int = 1) -> dict:
    """Minimal valid AniListMedia dict that passes model_validate."""
    return {
        "id": anime_id,
        "title": {"romaji": "Test Anime", "english": "Test Anime EN", "native": "テスト"},
        "episodes": 12,
        "coverImage": {
            "large": "https://example.com/large.jpg",
            "medium": "https://example.com/medium.jpg",
            "extraLarge": None,
        },
        "bannerImage": None,
        "genres": ["Action", "Drama"],
        "description": "A test anime description.",
        "averageScore": 80,
        "status": "FINISHED",
        "season": "SPRING",
        "seasonYear": 2020,
        "studios": {"nodes": [{"id": 1, "name": "Test Studio"}]},
    }


def make_anilist_page_response(anime_id: int = 1) -> dict:
    """AniList Page query response wrapping a single media item."""
    return {
        "data": {
            "Page": {
                "pageInfo": {"currentPage": 1, "hasNextPage": False, "perPage": 10},
                "media": [make_anilist_media_item(anime_id)],
            }
        }
    }


def make_anilist_media_batch_response(anime_ids: list[int] | None = None) -> dict:
    """AniList batch media response for fetch_anilist_media_map."""
    ids = anime_ids or [1]
    return {
        "data": {
            "Page": {
                "media": [make_anilist_media_item(aid) for aid in ids]
            }
        }
    }


def make_anilist_single_media_response(anime_id: int = 1) -> dict:
    """AniList Media query response (single media by ID)."""
    return {"data": {"Media": {"id": anime_id}}}


def make_anilist_error_response(message: str = "Not Found") -> dict:
    return {"errors": [{"message": message}]}


def make_anilist_genre_response(genres: list[str] | None = None) -> dict:
    return {"data": {"GenreCollection": genres or ["Action", "Drama", "Comedy"]}}


# ---------------------------------------------------------------------------
# Supabase row factories
# ---------------------------------------------------------------------------

def make_discussion_row(**overrides) -> dict:
    row = {
        "id": "00000000-0000-0000-0000-000000000001",
        "anime_id": 1,
        "category_id": "00000000-0000-0000-0000-000000000002",
        "created_by": "00000000-0000-0000-0000-000000000003",
        "title": "Test Discussion",
        "body": "This is the body of the discussion.",
        "thumbnail_path": None,
        "thumbnail_url": None,
        "is_spoiler": False,
        "is_locked": False,
        "is_pinned": False,
        "episode_number": None,
        "season_number": None,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "last_activity_at": "2024-01-01T00:00:00",
        "upvote_count": 0,
        "downvote_count": 0,
        "comment_count": 0,
    }
    row.update(overrides)
    return row


def make_comment_row(**overrides) -> dict:
    row = {
        "id": "comment-uuid-1",
        "discussion_id": "disc-uuid-1",
        "created_by": "user-uuid-1",
        "parent_comment_id": None,
        "body": "A test comment.",
        "is_spoiler": False,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
    }
    row.update(overrides)
    return row


def make_list_row(**overrides) -> dict:
    row = {
        "id": "00000000-0000-0000-0000-000000000010",
        "title": "My Anime List",
        "genre": None,
        "description": "A test list.",
        "visibility": "public",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "amount": 1,
        "owner_id": "00000000-0000-0000-0000-000000000003",
        "owner_username": "testuser",
        "user_list_entry": [
            {
                "id": "00000000-0000-0000-0000-000000000020",
                "list_id": "00000000-0000-0000-0000-000000000010",
                "anime_id": 1,
                "rank": 1,
                "genre": None,
                "created_at": "2024-01-01T00:00:00",
                "anime": make_anilist_media_item(1),
            }
        ],
    }
    row.update(overrides)
    return row


# ---------------------------------------------------------------------------
# Supabase client mock helpers
# ---------------------------------------------------------------------------

def make_supabase_response(data):
    """MagicMock with a .data attribute — mirrors a Supabase execute() result."""
    response = MagicMock()
    response.data = data
    return response


def make_supabase_builder(execute_data=None):
    """Fluent builder mock that mirrors the Supabase chained query API.

    The Supabase query builder uses synchronous method chaining (.table(),
    .select(), .eq(), …) with only .execute() being async. Using AsyncMock
    for the chain would make each call return a coroutine, breaking the chain.
    So chained methods are MagicMock (sync), and only execute is AsyncMock.

    The return value can be overridden per-test via:

        builder.execute.return_value = make_supabase_response(my_data)
        # or for multiple sequential calls:
        builder.execute.side_effect = [response1, response2, ...]
    """
    builder = MagicMock()
    for method_name in [
        "table", "select", "eq", "neq", "in_", "single",
        "insert", "upsert", "update", "delete", "order", "rpc",
        "limit", "range",
    ]:
        getattr(builder, method_name).return_value = builder
    # execute() is the only awaitable in the chain
    builder.execute = AsyncMock(return_value=make_supabase_response(execute_data))
    # storage is used in the discussions route for thumbnails
    builder.storage = MagicMock()
    return builder


def make_httpx_mock(response_data: dict, status_code: int = 200):
    """Return a (mock_cls, mock_client) pair for patching httpx.AsyncClient.

    Usage:
        mock_cls, mock_client = make_httpx_mock({"data": {...}})
        monkeypatch.setattr("routers.anime.httpx.AsyncClient", mock_cls)
    """
    mock_response = MagicMock()
    mock_response.status_code = status_code
    mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(return_value=response_data)

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)

    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

    return mock_cls, mock_client

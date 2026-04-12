"""Unit tests for helper functions in routers/anime.py."""

import pytest

from routers.anime import (
    _extract_graphql_errors,
    _has_forbidden_graphql_error,
    _raise_anilist_service_error,
    build_cache_key,
)


# ---------------------------------------------------------------------------
# _raise_anilist_service_error
# ---------------------------------------------------------------------------

def test_raise_anilist_service_error_raises_http_exception():
    from fastapi.exceptions import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        _raise_anilist_service_error(503, "Service unavailable")
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Service unavailable"


def test_raise_anilist_service_error_502():
    from fastapi.exceptions import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        _raise_anilist_service_error(502, "Bad gateway")
    assert exc_info.value.status_code == 502


# ---------------------------------------------------------------------------
# _has_forbidden_graphql_error
# ---------------------------------------------------------------------------

def test_no_errors_key_returns_false():
    assert _has_forbidden_graphql_error({"data": {}}) is False


def test_errors_not_a_list_returns_false():
    assert _has_forbidden_graphql_error({"errors": "some string"}) is False


def test_empty_errors_list_returns_false():
    assert _has_forbidden_graphql_error({"errors": []}) is False


def test_forbidden_in_message_returns_true():
    assert _has_forbidden_graphql_error({"errors": [{"message": "Forbidden access"}]}) is True


def test_unauthorized_in_message_returns_true():
    assert _has_forbidden_graphql_error({"errors": [{"message": "Unauthorized"}]}) is True


def test_forbidden_extension_code_returns_true():
    assert _has_forbidden_graphql_error({
        "errors": [{"message": "Error", "extensions": {"code": "FORBIDDEN"}}]
    }) is True


def test_unauthorized_extension_code_returns_true():
    assert _has_forbidden_graphql_error({
        "errors": [{"message": "Error", "extensions": {"code": "UNAUTHORIZED"}}]
    }) is True


def test_non_auth_error_returns_false():
    assert _has_forbidden_graphql_error({"errors": [{"message": "Not found"}]}) is False


def test_non_dict_items_in_errors_are_skipped():
    assert _has_forbidden_graphql_error({"errors": ["some string", 42]}) is False


# ---------------------------------------------------------------------------
# _extract_graphql_errors
# ---------------------------------------------------------------------------

def test_extract_no_errors_key_returns_empty():
    assert _extract_graphql_errors({"data": {}}) == []


def test_extract_errors_not_a_list_returns_empty():
    assert _extract_graphql_errors({"errors": "not a list"}) == []


def test_extract_filters_out_non_dict_items():
    result = _extract_graphql_errors({"errors": [{"message": "err"}, "bad", 42]})
    assert result == [{"message": "err"}]


def test_extract_returns_all_dict_items():
    errors = [{"message": "e1"}, {"message": "e2"}]
    assert _extract_graphql_errors({"errors": errors}) == errors


# ---------------------------------------------------------------------------
# build_cache_key
# ---------------------------------------------------------------------------

def test_build_cache_key_prefix_only():
    assert build_cache_key("anime:popular") == "anime:popular"


def test_build_cache_key_single_part():
    assert build_cache_key("anime:by_id", anime_id=1) == "anime:by_id:anime_id=1"


def test_build_cache_key_parts_are_sorted():
    key = build_cache_key("prefix", z="3", a="1")
    assert key == "prefix:a=1:z=3"


def test_build_cache_key_multiple_parts():
    key = build_cache_key("anime:categories", page=1, perPage=10, search="naruto")
    parts = key.split(":")
    # First part is the prefix
    assert parts[0] == "anime"
    assert parts[1] == "categories"
    # Remaining parts are sorted alphabetically
    remaining = parts[2:]
    assert remaining == sorted(remaining)

"""Unit tests for utilities/cache.py."""

import time
from unittest.mock import patch

import utilities.cache as cache_mod
from utilities.cache import get_cache, set_cache


def test_get_cache_miss_returns_none():
    assert get_cache("nonexistent") is None


def test_set_then_get_returns_value():
    set_cache("key1", {"data": 42}, ttl_seconds=60)
    assert get_cache("key1") == {"data": 42}


def test_get_expired_entry_returns_none():
    set_cache("key2", "some_value", ttl_seconds=10)
    # Simulate time advancing past the expiry
    with patch("utilities.cache.time") as mock_time:
        mock_time.time.return_value = time.time() + 20
        result = get_cache("key2")
    assert result is None


def test_expired_entry_is_pruned_from_cache():
    set_cache("key3", "value", ttl_seconds=10)
    assert "key3" in cache_mod._cache
    with patch("utilities.cache.time") as mock_time:
        mock_time.time.return_value = time.time() + 20
        get_cache("key3")
    assert "key3" not in cache_mod._cache


def test_zero_ttl_does_not_store():
    set_cache("key4", "value", ttl_seconds=0)
    assert get_cache("key4") is None
    assert "key4" not in cache_mod._cache


def test_negative_ttl_does_not_store():
    set_cache("key5", "value", ttl_seconds=-1)
    assert get_cache("key5") is None


def test_overwrite_existing_key():
    set_cache("key6", "first", ttl_seconds=60)
    set_cache("key6", "second", ttl_seconds=60)
    assert get_cache("key6") == "second"


def test_different_keys_are_independent():
    set_cache("a", 1, ttl_seconds=60)
    set_cache("b", 2, ttl_seconds=60)
    assert get_cache("a") == 1
    assert get_cache("b") == 2


def test_cache_stores_none_values_not_cached():
    # set_cache with ttl > 0 stores the value even if it's None-ish
    set_cache("key7", 0, ttl_seconds=60)
    # 0 is falsy but should still be returned
    assert get_cache("key7") == 0

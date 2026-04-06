"""Unit tests for utilities/auth_validator.py."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.helpers.mock_factories import make_fake_user


async def _call_validator(authorization: str, supabase_mock=None):
    """Helper to invoke auth_validator with a given header string."""
    from utilities.auth_validator import auth_validator
    return await auth_validator(authorization=authorization)


async def test_missing_authorization_raises_401(monkeypatch):
    from fastapi.exceptions import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await _call_validator("")
    assert exc_info.value.status_code == 401


async def test_wrong_prefix_raises_401(monkeypatch):
    from fastapi.exceptions import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await _call_validator("Token abc123")
    assert exc_info.value.status_code == 401


async def test_empty_token_after_bearer_raises_401(monkeypatch):
    from fastapi.exceptions import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await _call_validator("Bearer ")
    assert exc_info.value.status_code == 401


async def test_supabase_exception_raises_401(monkeypatch):
    from fastapi.exceptions import HTTPException

    supabase_mock = AsyncMock()
    supabase_mock.auth.get_user.side_effect = Exception("Auth error")
    monkeypatch.setattr(
        "utilities.auth_validator.get_supabase_client",
        AsyncMock(return_value=supabase_mock),
    )

    with pytest.raises(HTTPException) as exc_info:
        await _call_validator("Bearer valid-token")
    assert exc_info.value.status_code == 401


async def test_no_user_in_response_raises_401(monkeypatch):
    from fastapi.exceptions import HTTPException

    user_data = MagicMock()
    user_data.user = None

    supabase_mock = AsyncMock()
    supabase_mock.auth.get_user = AsyncMock(return_value=user_data)
    monkeypatch.setattr(
        "utilities.auth_validator.get_supabase_client",
        AsyncMock(return_value=supabase_mock),
    )

    with pytest.raises(HTTPException) as exc_info:
        await _call_validator("Bearer valid-token")
    assert exc_info.value.status_code == 401


async def test_valid_token_returns_user(monkeypatch):
    fake_user = make_fake_user()
    user_data = MagicMock()
    user_data.user = fake_user

    supabase_mock = AsyncMock()
    supabase_mock.auth.get_user = AsyncMock(return_value=user_data)
    monkeypatch.setattr(
        "utilities.auth_validator.get_supabase_client",
        AsyncMock(return_value=supabase_mock),
    )

    result = await _call_validator("Bearer valid-token")
    assert result is fake_user

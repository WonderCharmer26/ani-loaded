"""Unit tests for utilities/seasonFunctions.py."""

from utilities.seasonFunctions import SEASONS, get_cached_seasons


async def test_returns_all_four_seasons():
    result = await get_cached_seasons()
    assert set(result) == {"WINTER", "SPRING", "SUMMER", "FALL"}


async def test_returns_exactly_four_items():
    result = await get_cached_seasons()
    assert len(result) == 4


async def test_correct_order():
    result = await get_cached_seasons()
    assert result == ["WINTER", "SPRING", "SUMMER", "FALL"]


async def test_returns_a_copy_not_the_original():
    result = await get_cached_seasons()
    result.append("EXTRA")
    # The original constant must be unchanged
    assert SEASONS == ["WINTER", "SPRING", "SUMMER", "FALL"]


async def test_multiple_calls_return_same_values():
    first = await get_cached_seasons()
    second = await get_cached_seasons()
    assert first == second

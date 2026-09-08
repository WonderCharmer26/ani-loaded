from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from rag.rag_service import (
    get_completed_watchlist as rag_get_completed_watchlist,
)
from rag.rag_service import (
    get_users_whole_watchlist as rag_get_users_whole_watchlist,
)
from rag.rag_service import (
    search_similar_anime as rag_search_similar_anime,
)
from schemas.recommendations import MatchedAnimeResponse


@tool
async def search_similar_anime(
    query: str,
    match_count: int = 10,
    authorization: Annotated[str | None, InjectedState("authorization")] = None,
) -> list[MatchedAnimeResponse]:
    """
    Search the anime database for shows that match a plain-language description.
    Use descriptive queries like 'dark psychological thriller with an unreliable narrator'
    rather than just genre names. Returns a list of matching anime with metadata.
    """

    return await rag_search_similar_anime(
        query, match_count, authorization=authorization
    )


@tool
async def get_users_whole_watchlist(
    user_id: str,
    authorization: Annotated[str | None, InjectedState("authorization")] = None,
) -> list[dict]:
    # TODO: Add in schema to help with the return type of the data
    """
    Fetch a list of anime IDs and statuses from the user's watchlist.
    Use this when the agent needs the full watchlist context.
    Returns a list of AniList IDs and statuses.
    """

    return await rag_get_users_whole_watchlist(user_id, authorization=authorization)


# Tool to help with getting the anime that the user has watched from their watchlist
@tool
async def get_completed_watchlist(
    user_id: str,
    authorization: Annotated[str | None, InjectedState("authorization")] = None,
) -> list[int]:
    # TODO: Add in schema to help with the return type of the data
    """
    Fetch the list of anime IDs that the user has in their watchlist and has already seen.
    Use this first so you know what NOT to recommend (things they've already seen).
    Returns a list of AniList anime IDs.
    """

    return await rag_get_completed_watchlist(user_id, authorization=authorization)

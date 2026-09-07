import asyncio
import logging
import os

from openai import AsyncOpenAI
from supabase import AsyncClient

from database.supabase_client import close_supabase_client, get_supabase_client
from schemas.recommendations import MatchedAnimeResponse

logger = logging.getLogger(__name__)

# TODO: REFACTOR THE FILE TO MOVE HELPER FUNCTIONS INTO ITS OWN FOLDER/FILE TO HELP WITH CODEBASE STRUCTURE


def get_openai_client() -> AsyncOpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY must be set")
    return AsyncOpenAI(api_key=api_key)


# get the users query for embedding, and match_count for amount to match default 10
async def search_similar_anime(
    query: str,
    match_count: int = 10,
    authorization: str | None = None,
    supabase: AsyncClient | None = None,
) -> list[MatchedAnimeResponse]:
    created_supabase_client = False

    try:
        openai = get_openai_client()

        # create the embedding from the users query
        embedding_response = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )

        # the vector embedding that we got back from Open AI
        query_vector = embedding_response.data[0].embedding

        # open the supabase client for my need
        # Use the caller's JWT so Supabase evaluates the RPC/table access as
        # the authenticated user instead of the shared anonymous client.
        if supabase is None:
            supabase = await get_supabase_client(authorization)
            created_supabase_client = authorization is not None

        # NOTE: have to look into the function or make another tool, function alone is not handling edge cases when testing
        # run the custom supabse rpc function passing the vector in and then getting the top 10 anime that match
        result = await supabase.rpc(
            "match_anime", {"query_embedding": query_vector, "match_count": match_count}
        ).execute()

        # validate each row
        validated_results = [
            MatchedAnimeResponse.model_validate(row) for row in result.data or []
        ]
        logger.info(
            "Anime similarity search completed",
            extra={
                "query_preview": query[:120],
                "match_count": match_count,
                "result_count": len(validated_results),
                "result_titles": [result.title for result in validated_results[:5]],
            },
        )
        return validated_results
    except Exception:
        logger.exception(
            "Anime similarity search failed",
            extra={
                "query_preview": query[:120],
                "match_count": match_count,
                "has_authorization": bool(authorization),
            },
        )
        raise
    finally:
        if created_supabase_client and supabase is not None:
            await close_supabase_client(supabase)


async def get_users_whole_watchlist(
    user_id: str,
    authorization: str | None = None,
    supabase: AsyncClient | None = None,
) -> list[dict]:
    """
    Fetch a list of anime IDs and statuses from the user's watchlist.
    Returns a list of AniList IDs and statuses.
    """
    created_supabase_client = False

    try:
        if supabase is None:
            supabase = await get_supabase_client(authorization)
            created_supabase_client = authorization is not None

        result = await (
            supabase.from_("user_watchlist")
            .select("anime_id, status")
            .eq("user_id", user_id)
            .execute()
        )

        return [
            {"anime_id": row["anime_id"], "status": row["status"]}
            for row in result.data or []
        ]
    except Exception:
        logger.exception(
            "Failed to fetch user watchlist",
            extra={"user_id": user_id},
        )
        raise
    finally:
        if created_supabase_client and supabase is not None:
            await close_supabase_client(supabase)


# get the shows that the user has completed to help filter
async def get_completed_watchlist(
    user_id: str,
    authorization: str | None = None,
    supabase: AsyncClient | None = None,
) -> list[int]:
    """
    Fetch the list of anime IDs that the user has completed.
    Returns a list of AniList anime IDs.
    """
    created_supabase_client = False

    try:
        if supabase is None:
            supabase = await get_supabase_client(authorization)
            created_supabase_client = authorization is not None

        result = await (
            supabase.table("user_watchlist")
            .select("anime_id")
            .eq("user_id", user_id)
            .eq("status", "completed")
            .execute()
        )

        completed_ids = [row["anime_id"] for row in result.data or []]

        logger.info(
            "Fetched completed watchlist ids",
            extra={
                "user_id": user_id,
                "completed_count": len(completed_ids),
                "completed_id_sample": completed_ids[:10],
            },
        )
        return completed_ids
    except Exception:
        logger.exception(
            "Failed to fetch completed watchlist",
            extra={"user_id": user_id},
        )
        raise
    finally:
        if created_supabase_client and supabase is not None:
            await close_supabase_client(supabase)


# gets similar anime from supabase as well as the shows that the user watched as well and returns the filtered result
async def get_filtered_recommendations(
    user_id: str,
    query: str,
    match_count: int = 10,
    authorization: str | None = None,
    supabase: AsyncClient | None = None,
) -> list[MatchedAnimeResponse]:
    try:
        # run both queries concurrently (helps us with making sure that db calls stay fast)
        search_args = (query, match_count, authorization)
        completed_args = (user_id, authorization)
        if supabase is not None:
            search_args += (supabase,)
            completed_args += (supabase,)

        search_results, completed_ids = await asyncio.gather(
            search_similar_anime(*search_args),
            get_completed_watchlist(*completed_args),
        )

        # filter out dupes
        completed_set = set(completed_ids)

        # return an anime_id's of the shows that aren't in the completed_set of anime
        filtered_results = [
            result for result in search_results if result.id not in completed_set
        ]
        logger.info(
            "Prepared filtered recommendations",
            extra={
                "user_id": user_id,
                "query_preview": query[:120],
                "raw_search_result_count": len(search_results),
                "completed_watchlist_count": len(completed_ids),
                "filtered_result_count": len(filtered_results),
                "filtered_result_titles": [
                    result.title for result in filtered_results[:5]
                ],
            },
        )
        return filtered_results
    except Exception:
        logger.exception(
            "Failed to prepare filtered recommendations",
            extra={
                "user_id": user_id,
                "query_preview": query[:120],
                "match_count": match_count,
            },
        )
        raise

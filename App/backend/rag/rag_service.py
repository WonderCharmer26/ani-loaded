import asyncio
import logging
import os

from openai import AsyncOpenAI

from database.supabase_client import get_supabase_client
from schemas.recommendations import MatchedAnimeResponse

logger = logging.getLogger(__name__)
openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

# NOTE: THE FUNCTIONS IN THIS FILE CAN BE USED ACROSS THE APPLICATION WHERE NEEDED
# NOTE: THESE FUNCTION ARE ALSO USED IN THE AGENT TOOLS TO BE ABLE TO HELP WITH THE RECOMMENDATIONS


# get the users query for embedding, and match_count for amount to match default 10
async def search_similar_anime(
    query: str, match_count: int = 10
) -> list[MatchedAnimeResponse]:

    try:
        # create the embedding from the users query
        embedding_response = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )

        # the vector embedding that we got back from Open AI
        query_vector = embedding_response.data[0].embedding

        # open the supabase client for my need
        supabase = await get_supabase_client()

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
            },
        )
        raise


async def get_users_whole_watchlist(
    user_id: str, authorization: str | None = None
) -> list[dict]:
    """
    Fetch a list of anime IDs and statuses from the user's watchlist.
    Returns a list of AniList IDs and statuses.
    """

    try:
        supabase = await get_supabase_client(authorization)

        result = await (
            supabase.from_("user_watchlist")
            .select("anime_id, status")
            .eq("user_id", user_id)
            .execute()
        )

        return [
            {"anime_id": row["anime_id"], "status": row["status"]}
            for row in result.data
        ]
    except Exception:
        logger.exception(
            "Failed to fetch user watchlist",
            extra={"user_id": user_id},
        )
        raise


async def get_completed_watchlist(
    user_id: str, authorization: str | None = None
) -> list[int]:
    """
    Fetch the list of anime IDs that the user has completed.
    Returns a list of AniList anime IDs.
    """

    try:
        supabase = await get_supabase_client(authorization)

        result = await (
            supabase.table("user_watchlist")
            .select("anime_id")
            .eq("user_id", user_id)
            .eq("status", "completed")
            .execute()
        )

        completed_ids = [row["anime_id"] for row in result.data]
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


async def get_filtered_recommendations(
    user_id: str,
    query: str,
    match_count: int = 10,
    authorization: str | None = None,
) -> list[MatchedAnimeResponse]:
    try:
        # run both queries concurrently (helps us with making sure that db calls stay fast)
        search_results, completed_ids = await asyncio.gather(
            search_similar_anime(query, match_count),
            get_completed_watchlist(user_id, authorization),
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

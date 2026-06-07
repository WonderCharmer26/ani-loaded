from openai import AsyncOpenAI
from database.supabase_client import get_supabase_client
import os

openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


# get the users query for embedding, and match_count for amount to match default 10
async def search_similar_anime(query: str, match_count: int = 10) -> list[dict]:

    # create the embedding from the query
    embedding_response = await openai.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )

    # get back the vector embedding that we got back from Open AI
    query_vector = embedding_response.data[0].embedding

    # open the supabase client for my need
    supabase = await get_supabase_client()

    # run the supabse rpc function passing the vector into and the amount of results we want to get back
    result = await supabase.rpc(
        "match_anime", {"query_embedding": query_vector, "match_count": match_count}
    ).execute()

    return result.data


async def get_users_whole_watchlist(user_id: str) -> list[dict]:
    """
    Fetch a list of anime IDs and statuses from the user's watchlist.
    Returns a list of AniList IDs and statuses.
    """

    supabase = await get_supabase_client()

    result = await (
        supabase.from_("user_watchlist")
        .select("anime_id, status")
        .eq("owner_id", user_id)
        .execute()
    )

    return [
        {"anime_id": row["anime_id"], "status": row["status"]} for row in result.data
    ]


async def get_completed_watchlist(user_id: str) -> list[int]:
    """
    Fetch the list of anime IDs that the user has completed.
    Returns a list of AniList anime IDs.
    """

    supabase = await get_supabase_client()

    result = await (
        supabase.table("user_watchlist")
        .select("anime_id")
        .eq("owner_id", user_id)
        .eq("status", "completed")
        .execute()
    )

    return [row["anime_id"] for row in result.data]

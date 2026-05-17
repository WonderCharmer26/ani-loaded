from openai import AsyncOpenAI
from database.supabase_client import get_supabase_client
import os

openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


# get the users query for embedding, and match_count for amount to match default 10
async def search_similar_anime(query: str, match_count: int = 10) -> list[dict]:

    # create the embedding w/ the query
    embedding_response = await openai.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )

    # get back the first result for after the embedding
    query_vector = embedding_response.data[0].embedding

    # open the supabase client for my need
    supabase = await get_supabase_client()

    # run the supabse rpc function
    result = await supabase.rpc(
        "match_anime", {"query_embedding": query_vector, "match_count": match_count}
    ).execute()

    return result.data


async def get_user_watched_ids(user_id: str) -> list[int]:
    """
    Pulls the user's completed list from Supabase so the agent
    knows what NOT to recommend (already watched).
    """

    # async
    supabase = await get_supabase_client()

    # get the usesrs animes that they have marked as watched
    result = await (
        supabase.table("user_watchlist")
        .select("anime_id")
        .eq("user_id", user_id)
        .eq("watched", True)
        .execute()
    )

    # return an array of the results of the anime from the db
    # if not it's empty
    return [row["anime_id"] for row in result.data]

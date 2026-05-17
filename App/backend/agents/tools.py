from langchain_core.tools import tool
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore

from database.supabase_client import get_supabase_client

# Initialize embeddings once at module level.
# It only makes a call when you actually pass text into it.
_embeddings = OpenAIEmbeddings(model="text-embedding-3-small")


@tool
async def search_similar_anime(query: str, match_count: int = 10) -> list[dict]:
    """
    Search the anime database for shows that match a plain-language description.
    Use descriptive queries like 'dark psychological thriller with an unreliable narrator'
    rather than just genre names. Returns a list of matching anime with metadata.
    """

    supabase = await get_supabase_client()

    # SupabaseVectorStore wraps our match_anime RPC function
    vector_store = SupabaseVectorStore(
        client=supabase,
        embedding=_embeddings,
        table_name="anime_embeddings",
        query_name="match_anime",  # must match the SQL function name exactly, update if the name changes
    )

    results = await vector_store.asimilarity_search(query, k=match_count)

    # Convert Document objects into plain dicts the agent can read and reason over
    # We truncate description to 300 chars because we don't want to bloat the agent's context window
    return [
        {
            "title": doc.metadata.get("title"),
            "genres": doc.metadata.get("genres"),
            "description": doc.page_content[:300],
            "average_score": doc.metadata.get("average_score"),
            "cover_url": doc.metadata.get("cover_url"),
            "anilist_id": doc.metadata.get("id"),
        }
        for doc in results
    ]


@tool
async def get_user_watched_list(user_id: str) -> list[int]:
    """
    Fetch the list of anime IDs that the user has already added to their lists.
    Use this first so you know what NOT to recommend (things they've already seen).
    Returns a list of AniList anime IDs.
    """

    supabase = await get_supabase_client()

    # We join user_list_entry → user_list to filter by the owner's user_id.
    # The !inner syntax in PostgREST means it only returns entries where
    # the join succeeds — equivalent to an INNER JOIN in SQL.
    result = await (
        supabase.table("user_list_entry")
        .select("anime_id, user_list!inner(owner_id)")
        .eq("user_list.owner_id", user_id)
        .execute()
    )

    return [row["anime_id"] for row in result.data]

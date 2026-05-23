import asyncio
import httpx
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

from supabase import acreate_client

# from database.supabase_client import get_supabase_client

load_dotenv()

# anilist url
ANILIST_URL = "https://graphql.anilist.co"

# example query that will be used in func later
SEED_QUERY = """
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
    }
    media(type: ANIME, sort: POPULARITY_DESC) {
      id
      title { english romaji }
      genres
      description(asHtml: false)
      averageScore
      status
      season
      seasonYear
      coverImage { large }
    }
  }
}
"""


# creat the embedding string taking the dict of the anime and form the embedding function
def build_embedding_text(anime: dict) -> str:
    title = anime["title"].get("english") or anime["title"].get("romaji", "")
    genres = ", ".join(anime.get("genres") or [])
    description = anime.get("description") or ""
    status = anime.get("status") or ""
    season = f"{anime.get('season', '')} {anime.get('seasonYear', '')}".strip()

    return f"Title: {title}. Genres: {genres}. Status: {status}. Season: {season}. {description}"


# make the request to the animelist api and add the data to the database
async def seed():
    # openai client to make help with starting the connection to openai
    openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # used anon key to bypass the RLS
    supabase = await acreate_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],
    )

    # async client for supabase
    # supabase = await get_supabase_client()

    page = 1  # starting page
    has_next = True

    # open the connection and continue the embedding as long as theres more in the pagination
    while has_next:
        # make a request to the anilist api for the rest of the anime
        async with httpx.AsyncClient() as client:
            response = await client.post(
                ANILIST_URL,
                json={"query": SEED_QUERY, "variables": {"page": page, "perPage": 50}},
                headers={"Content-Type": "application/json"},
            )

        response.raise_for_status()
        payload = response.json()

        if "errors" in payload:
            print(f"AniList API error on page {page}: {payload['errors']}")
            break

        page_data = payload.get("data", {}).get("Page")
        if page_data is None:
            print(f"No page data returned for page {page}")
            break

        anime_list = page_data["media"]
        has_next = page_data["pageInfo"]["hasNextPage"]

        # Build all the embedding texts for this batch
        texts = [build_embedding_text(anime) for anime in anime_list]

        # Get embeddings for the whole batch in one API call (much more efficient)
        embedding_response = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        embeddings = [item.embedding for item in embedding_response.data]

        # Build rows to upsert
        rows = []
        for anime, embedding in zip(anime_list, embeddings):
            title = anime["title"].get("english") or anime["title"].get("romaji")
            rows.append(
                {
                    "id": anime["id"],
                    "title": title,
                    "genres": anime.get("genres") or [],
                    "description": anime.get("description") or "",
                    "average_score": anime.get("averageScore"),
                    "status": anime.get("status"),
                    "cover_url": anime["coverImage"]["large"],
                    "embedding": embedding,  # the 1536-dim vector
                }
            )

        # upsert = insert new, update if id already exists
        await supabase.table("anime_embeddings").upsert(rows).execute()

        print(f"Seeded page {page} ({len(rows)} anime)")
        page += 1

        # AniList rate limit is 90 requests/min — be polite
        await asyncio.sleep(0.8)


if __name__ == "__main__":
    asyncio.run(seed())

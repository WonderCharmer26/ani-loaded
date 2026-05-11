# backend/scripts/seed_anime_embeddings.py
import asyncio
import httpx
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from supabase import acreate_client

load_dotenv()

ANILIST_URL = "https://graphql.anilist.co"

# This is the query you'll paginate through. Note we fetch description
# because that's the richest text for building a good embedding.
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


def build_embedding_text(anime: dict) -> str:
    """
    This is important — the quality of your vector search depends on
    how you represent each anime as text. You want to pack in the
    most semantically meaningful fields.
    """
    title = anime["title"].get("english") or anime["title"].get("romaji", "")
    genres = ", ".join(anime.get("genres") or [])
    description = anime.get("description") or ""
    status = anime.get("status") or ""
    season = f"{anime.get('season', '')} {anime.get('seasonYear', '')}".strip()

    return f"Title: {title}. Genres: {genres}. Status: {status}. Season: {season}. {description}"


async def seed():
    openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    supabase = await acreate_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],  # use service key for seeding, not anon key
    )

    page = 1
    has_next = True

    while has_next:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                ANILIST_URL,
                json={"query": SEED_QUERY, "variables": {"page": page, "perPage": 50}},
                headers={"Content-Type": "application/json"},
            )

        page_data = response.json()["data"]["Page"]
        anime_list = page_data["media"]
        has_next = page_data["pageInfo"]["hasNextPage"]

        # Build all the embedding texts for this batch
        texts = [build_embedding_text(a) for a in anime_list]

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


asyncio.run(seed())

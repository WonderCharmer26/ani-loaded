import httpx

from fastapi.exceptions import HTTPException

from schemas.anilist import AniListMedia
from utilities.cache import get_cache, set_cache
from utilities.genreFunctions import ANILIST_URL

ANILIST_LIST_MEDIA_CACHE_TTL_SECONDS = 1800

ANILIST_MEDIA_BATCH_QUERY = """
query ($ids: [Int], $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(id_in: $ids, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      episodes
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      genres
      description(asHtml: false)
      averageScore
      status(version: 2)
      season
      seasonYear
      studios(isMain: true) {
        nodes {
          id
          name
        }
      }
    }
  }
}
"""


def _build_media_cache_key(anime_ids: list[int]) -> str:
    sorted_ids = sorted(set(anime_ids))
    return "anilist:media:" + ",".join(str(anime_id) for anime_id in sorted_ids)


async def fetch_anilist_media_map(anime_ids: list[int]) -> dict[int, dict]:
    if not anime_ids:
        return {}

    unique_ids = sorted(set(anime_ids))
    cache_key = _build_media_cache_key(unique_ids)
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    variables = {"ids": unique_ids, "perPage": len(unique_ids)}

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            response = await client.post(
                ANILIST_URL,
                json={"query": ANILIST_MEDIA_BATCH_QUERY, "variables": variables},
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            payload = response.json()

            if "errors" in payload:
                raise HTTPException(status_code=503, detail="AniList media fetch failed")

            media_items = payload.get("data", {}).get("Page", {}).get("media", [])
            media_map: dict[int, dict] = {}
            for item in media_items:
                validated = AniListMedia.model_validate(item)
                media_map[validated.id] = validated.model_dump()

            set_cache(cache_key, media_map, ANILIST_LIST_MEDIA_CACHE_TTL_SECONDS)
            return media_map

        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=503,
                detail=f"AniList media fetch failed: {error.response.status_code}",
            )
        except httpx.RequestError as error:
            raise HTTPException(
                status_code=503,
                detail=f"AniList media request failed: {error}",
            )

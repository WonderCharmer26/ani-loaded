import httpx  # for handling the requests on the backend to get data from the Ani-list api
from typing import Any, Mapping
from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
from schemas.category_requests import CategoryFilter
from utilities.cache import get_cache, set_cache
from utilities.genreFunctions import ANILIST_URL, get_cached_genre
from utilities.seasonFunctions import get_cached_seasons

router = APIRouter()

# NOTE: PLANNING ON SWITCHING TO REDIS LATER ON INSTEAD OF SERVER BUILT CACHE

# Constant times for the cache
CATEGORIES_CACHE_TTL_SECONDS = 300  # 5 min
POPULAR_CACHE_TTL_SECONDS = 600  # 10 min
TRENDING_CACHE_TTL_SECONDS = 600  # 10 mmin
TOP_CACHE_TTL_SECONDS = 600  # 10 min
ANIME_BY_ID_CACHE_TTL_SECONDS = 1800  # 30 min

# retry timeout
ANILIST_TIMEOUT = httpx.Timeout(10.0, connect=5.0)

# TODO: MOVE THESE FUNCTIONS TO SEPERATE PY FILE TO HELP KEEP STRUCTURE CLEAN

# helper function to help keep raising status_code errors cleaner
def _raise_anilist_service_error(status_code: int, detail: str) -> None:
    raise HTTPException(status_code=status_code, detail=detail)


# helper to handle GraphQL errors
def _has_forbidden_graphql_error(data: dict) -> bool:
    errors = data.get("errors")
    if not isinstance(errors, list):
        return False

    for item in errors:
        if not isinstance(item, dict):
            continue

        message = str(item.get("message", "")).lower()
        extensions = item.get("extensions")
        code = ""
        if isinstance(extensions, dict):
            code = str(extensions.get("code", "")).lower()

        if "forbidden" in message or "unauthorized" in message or code in {
            "forbidden",
            "unauthorized",
        }:
            return True

    return False


# helper to get the GraphQL errors
def _extract_graphql_errors(data: dict[str, Any]) -> list[dict[str, Any]]:
    errors = data.get("errors")
    if isinstance(errors, list):
        return [item for item in errors if isinstance(item, dict)]
    return []


# helper function to post handle getting anilist data and catching errors
async def _post_to_anilist(
    client: httpx.AsyncClient, query: str, variables: Mapping[str, Any]
) -> dict[str, Any]:
    response: httpx.Response | None = None
    try:
        response = await client.post(
            ANILIST_URL,
            json={"query": query, "variables": variables},
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        status = error.response.status_code
        if status in {401, 403}:
            _raise_anilist_service_error(
                503, "AniList service unavailable or access restricted."
            )
        if status == 429:
            _raise_anilist_service_error(
                503, "AniList is rate-limited right now. Please try again soon."
            )
        if status >= 500:
            _raise_anilist_service_error(
                503, "AniList service is temporarily unavailable."
            )
        _raise_anilist_service_error(
            502, "AniList returned an unexpected upstream response."
        )
    except httpx.RequestError:
        _raise_anilist_service_error(
            503, "Could not connect to AniList. Please try again soon."
        )

    if response is None:
        _raise_anilist_service_error(503, "AniList request did not return a response.")
    assert response is not None

    data: Any = None
    try:
        data = response.json()
    except ValueError:
        _raise_anilist_service_error(502, "AniList returned invalid response data.")

    if not isinstance(data, dict):
        _raise_anilist_service_error(502, "AniList returned an invalid payload shape.")

    if "errors" in data:
        if _has_forbidden_graphql_error(data):
            _raise_anilist_service_error(
                503, "AniList service unavailable or access restricted."
            )

        errors = _extract_graphql_errors(data)
        if errors:
            _raise_anilist_service_error(502, str(errors))

        _raise_anilist_service_error(502, "AniList returned a GraphQL error.")

    return data


# function to build a cache key
# NOTE: probably replace with redis
def build_cache_key(prefix: str, **parts: object) -> str:
    ordered_parts = [f"{key}={parts[key]}" for key in sorted(parts)]
    if not ordered_parts:
        return prefix
    return f"{prefix}:{':'.join(ordered_parts)}"


# route to get genres from AniList (might update the params to get the genre and pass it in to fetch from the anilist)
@router.get("/anime/genres")
async def get_genres():
    """Fetch all genres from AniList and return cached list."""
    return {"genres": await get_cached_genre()}


# route to get the seasons from the backend (might update the params to get the genre and pass it in to fetch from the anilist)
@router.get("/anime/seasons")
async def get_seasons():
    """Fetch all seasons from AniList and return cached list."""
    return {"seasons": await get_cached_seasons()}


# route to get the filtered anime options from AniList (handles the searches as well)
@router.get("/anime/categories")
async def get_categories(filters: CategoryFilter = Depends()):
    # filter is set up in a seperate schema file

    variables: dict[str, Any] = {}  # initialize variables to store the parameters

    # check if filters are sent as params in the request
    if filters.search:
        variables["search"] = filters.search

    # set the sorting bases on if search is used
    variables["sort"] = ["SEARCH_MATCH"] if filters.search else ["POPULARITY_DESC"]

    if filters.genres:
        # store the variables in the dict
        variables["genres"] = [filters.genres]  # package as an array
    if filters.season:
        # store the variables in the dict
        variables["season"] = filters.season
    # account for the pages params if there are any
    if filters.page:
        variables["page"] = filters.page
    if filters.perPage:
        variables["perPage"] = filters.perPage

    cache_key = build_cache_key(
        "anime:categories",
        genres=filters.genres or "",
        page=variables.get("page", 1),
        perPage=variables.get("perPage", 10),
        search=filters.search or "",
        season=filters.season or "",
        sort=variables["sort"][0],
    )
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    # query for anilist (genre and season passed into the query)
    # NOTE: ADD IN PAGINATION SO THAT THERE ARE ONLY A VIEW ANIME PER PAGE AND THE USER CAN SCOURE THROUGH THE REST
    query = """
    query($search: String, $sort: [MediaSort], $perPage: Int, $page: Int, $genres: [String], $season: MediaSeason) {
        Page(page: $page, perPage: $perPage) {
            pageInfo {
                currentPage
                hasNextPage
                perPage
            }
            media(search: $search, type: ANIME, genre_in: $genres, season: $season, sort: $sort){
                id
                title {
                romaji
                english
                native
                }
                episodes
                coverImage {
                large
                medium
                }
                genres
                season
                seasonYear
                averageScore
                status(version: 2)
            }
        }
    }
    """

    # use pass in the variables and make the request
    async with httpx.AsyncClient(timeout=ANILIST_TIMEOUT) as client:
        data = await _post_to_anilist(client, query, variables)

    # set the cache data
    set_cache(cache_key, data, CATEGORIES_CACHE_TTL_SECONDS)

    # otherwise return the data
    return data


# route to get the popular anime from Ani-list
@router.get("/anime/popular")
async def get_anime_popular():
    """
    NOTE: This fetch gets the popular anime from Ani-list so that I can return the
    anime to the frontend Carousel Component via /anime/popular
    """

    # query that being sent
    query = """

    query ($perPage: Int, $page: Int) {
        Page(page: $page, perPage: $perPage) {
            media(type: ANIME, sort: POPULARITY_DESC){
                id
                title {
                  romaji
                  english
                  native
                }
                episodes
                coverImage {
                  large
                  medium
                }
                genres
                averageScore
                status(version: 2)
            }
        }
    }
    """

    # pass in the variables that will be passed into the query when sent
    variables = {
        "page": 1,
        "perPage": 10,
    }  # amount of anime retrieved I might change later on

    # build the cache
    cache_key = build_cache_key(
        "anime:popular", page=variables["page"], perPage=variables["perPage"]
    )

    # get the data
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    # send the query with the variables to get teh popular anime
    async with httpx.AsyncClient(timeout=ANILIST_TIMEOUT) as client:
        data = await _post_to_anilist(client, query, variables)

    set_cache(cache_key, data, POPULAR_CACHE_TTL_SECONDS)

    # return the data
    return data


# route to get the trending anime from Ani-list
@router.get("/anime/trending")
async def get_anime_trending():
    """
    NOTE: May adjust for amount for rendering on trending anime page
    and manually tweak the amount rendered in frontend component like CardCarousel
    via /anime/trending
    """
    # set up the query to get the trending anime
    query = """

    query ($perPage: Int, $page: Int) {
        Page(page: $page, perPage: $perPage) {
           media(type: ANIME, sort: TRENDING_DESC) {
               id
               title {
                romaji
                english
                native
               }
               episodes
               coverImage {
                large
                medium
               }
               genres
               averageScore
               status
           }
        }
    }"""

    # variables that can be used to get the amount of items that I want
    # NOTE: May tweak to more perPage later on after CardCarousel is completed and manually tweak on frontend
    variables = {
        "page": 1,
        "perPage": 10,
    }  # set the amount items per page, might tweak to have more later on

    cache_key = build_cache_key(
        "anime:trending", page=variables["page"], perPage=variables["perPage"]
    )
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    # send the query to the Ani-list api
    async with httpx.AsyncClient(timeout=ANILIST_TIMEOUT) as client:
        data = await _post_to_anilist(client, query, variables)

    set_cache(cache_key, data, TRENDING_CACHE_TTL_SECONDS)

    # return the data
    return data


# Route to get the top anime from anilist
@router.get("/anime/top")  # get all the top anime (no parameters needed)
async def get_anime_top():  # NOTE: may add in param from the frontend if needed
    # this query is sorted in descending order
    # set up the query string
    query = """
     query ($perPage: Int, $page: Int) {
        Page(page: $page, perPage: $perPage) {
            media(type: ANIME, sort: SCORE_DESC){
                id
                title {
                  romaji
                  english
                  native
                }
                episodes
                coverImage {
                  large
                  medium
                }
                genres
                averageScore
                status(version: 2)
            }
        }
    }
    """

    # get the 1st page, will swap to get the params from the frontend call
    variables = {"page": 1, "perPage": 10}

    cache_key = build_cache_key(
        "anime:top", page=variables["page"], perPage=variables["perPage"]
    )
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    # make the call to get the data
    async with httpx.AsyncClient(timeout=ANILIST_TIMEOUT) as client:
        data = await _post_to_anilist(client, query, variables)

    set_cache(cache_key, data, TOP_CACHE_TTL_SECONDS)

    # return the data to the frontend if the fetch was successful
    return data


# TODO: MAKE A ROUTE TO GET ANIME THAT MATCHES A SPECIFIC NAME


# NOTE: Route to get specific anime info to pass in into the anime pages
@router.get("/anime/{anime_id}")
async def get_anime_by_id(
    anime_id: int,
):  # pass in the anime_id from the req as a param
    """
    This function returns neccisary info for the anime page
    """
    query = """
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        format
        status
        episodes
        averageScore
        genres
        description(asHtml: false)
        studios (isMain: true) {
            nodes {
                id
                name
                }
        }
        characters(sort: [ROLE, RELEVANCE, ID], perPage: 10) {
         edges {
            role
            node {
                id
            name {
                full
                native
            }
            image {
                large
            }
        }
        voiceActors(language: JAPANESE) {
          id
          name {
            full
            native
          }
          image {
            large
          }
          languageV2
        }
      }
    }
  }
}
    """

    # variables that will be used to get the anime by its id
    variables = {"id": anime_id}

    cache_key = build_cache_key("anime:by_id", anime_id=anime_id)
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    # send the query to the Ani-list api
    async with httpx.AsyncClient(timeout=ANILIST_TIMEOUT) as client:
        data = await _post_to_anilist(client, query, variables)

    set_cache(cache_key, data, ANIME_BY_ID_CACHE_TTL_SECONDS)

    # return the data needed for the anime pages
    return data

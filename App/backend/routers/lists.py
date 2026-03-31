from dotenv import load_dotenv
from fastapi import APIRouter, Header
from fastapi.exceptions import HTTPException
from gotrue import Optional
from gotrue.types import User

from database.supabase_client import supabase

from routers.discussions import validate_anime_exists
from schemas.lists import UserListCreate, UserListWithAllAnime, UserListResponseWrapper, SpecificUserListWithAnime
from utilities.auth_validator import auth_validator
from utilities.anilist_client import fetch_anilist_media_map


# connect to the router
router = APIRouter()

# might load in variables
load_dotenv()

# NOTE: For other devs, I chose to return a pydantic model for validation purposes, fastapi handles the conversion
# TODO: MAKE SUPABASE AWAIT INSTEAD OF SYNCRANOUS


# helper func - ima move it later on
async def attach_anime_to_list_entries(list_rows: list[dict]) -> list[dict]:
    # get the anime_ids from the dict
    anime_ids = {
        entry["anime_id"]
        for list_row in list_rows
        for entry in list_row.get("user_list_entry", [])
        if entry.get("anime_id") is not None
    }

    # return the empty array if no anime_ids
    if not anime_ids:
        return list_rows

    media_map = await fetch_anilist_media_map(list(anime_ids))

    for list_row in list_rows:
        hydrated_entries = []
        for entry in list_row.get("user_list_entry", []):
            # combine the entry data
            hydrated_entry = {
                **entry,
                # add anime data
                "anime": media_map.get(entry.get("anime_id")),
            }
            # combine
            hydrated_entries.append(hydrated_entry)

        # change value
        list_row["user_list_entry"] = hydrated_entries

    # return combined data
    return list_rows


# function gets owner_id from list row data and fetches username from db and packages it to add to return data
def normalize_owner_username(list_rows: list[dict]) -> list[dict]:
    owner_ids = {
        str(list_row["owner_id"])
        for list_row in list_rows
        if list_row.get("owner_id") is not None
    }

    username_by_user_id: dict[str, str] = {}

    # get usernames
    if owner_ids:
        profile_response = (
            supabase.table("profiles")
            .select("user_id, username")
            .in_("user_id", list(owner_ids))
            .execute()
        )
        for profile_row in profile_response.data or []:
            user_id = profile_row.get("user_id")
            if user_id is None:
                continue
            username_by_user_id[str(user_id)] = profile_row.get("username") or "Unknown"

    normalized: list[dict] = []

    # package make into list
    for list_row in list_rows:
        owner_id = list_row.get("owner_id")
        owner_username = username_by_user_id.get(str(owner_id), "Unknown")
        normalized_row = {**list_row, "owner_username": owner_username}
        normalized_row.pop("owner_id", None)
        normalized.append(normalized_row)

    return normalized


# display all users lists
@router.get("/lists", response_model=list[UserListWithAllAnime])
async def get_all_lists():
    # access the supabase table
    try:
        # get the users_list and the user_list_entry that are public
        res = (
            supabase.table("user_list")
            .select("*, user_list_entry(*)")
            .eq("visibility", "public")
            .execute()
        )

        if not res.data:
            raise HTTPException(
                status_code=404, detail="No lists found"
            )

        rows_with_usernames = normalize_owner_username(res.data)
        hydrated = await attach_anime_to_list_entries(rows_with_usernames)

        # validate all the items in the list
        validated_list = [UserListWithAllAnime.model_validate(item) for item in hydrated]

        return validated_list

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"There was an error: {e}",
        )

# this route doesn't need to be protected
@router.get("/list/{list_id}", response_model=SpecificUserListWithAnime)
async def get_specific_list(list_id : str, authorization: Optional[str] = Header(None)):
    user: User | None = None
    # check the user

    if authorization:
        user = auth_validator(authorization)
       
    # try to make a req to get the specific list data and the entries
    try:
        res = supabase.table("user_list").select("*, user_list_entry(*)").eq("id", list_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Could not find this specific list")

        row = res.data[0]

        is_owner = user is not None and str(user.id) == str(row.get("owner_id"))

        # handle private lists to make sure it's protected
        if row.get("visibility") != "public" and not is_owner:
            raise HTTPException(status_code=403, detail="This list is private")

        # get the username
        username_from_row = normalize_owner_username([row])[0]
        # add the anime data from anilist
        hydrated_row = (await attach_anime_to_list_entries([username_from_row]))[0]

        # final stamp for owner_id
        final_stamp = {**hydrated_row, "is_owner": is_owner}

        # validate all the items in the list
        return SpecificUserListWithAnime.model_validate(final_stamp) 


    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"There was an error: {e}")

@router.put("/list/{list_id}")
async def change_specific_list(list_id: str, authorization: str = Header(...)):
    # check the token (handles raising errors)
    user: User = auth_validator(authorization)

    try:
        # make the update if the user_id and list_id matches
        res = (
            supabase.table("user_list")
            .update({})
            .eq("owner_id", user.id)
            .eq("id", list_id)
            .execute()
        )
    except:
        pass
    pass


# protected route (get users lists shown on profile page)
@router.get("/user-lists")
async def get_users_lists(authorization: str = Header(...)):
    # check if the user is validated
    # check the database for tables that match the users id
    # NOTE: make sure RLS is added to the table before hand so the user can only get their own data
    # handle if there are no tables
    # return lists to the frontend
    pass


@router.get("/popular-lists")
async def get_popular_lists():
    pass


# protected route
@router.post("/create-list", response_model=UserListResponseWrapper)
async def create_list(
    payload: UserListCreate,
    authorization: str = Header(...),
):
    # check if the user is validated (handles raising error) (gets back user obj)
    user: User = auth_validator(authorization)

    # store the entries to break down
    entries = payload.entries

    # check the animes chosen (might try to change into a set)
    for each_entry in entries:
        # Might add in a check for the anime number to make sure its positive (dont think I need it tho tbh)
        # validates each entry other wise raises an error
        anime_exists = await validate_anime_exists(
            each_entry.anime_id
        )  # make sure that the userid matches the list table
        if not anime_exists:
            raise HTTPException(
                status_code=404, detail="Anime was not found when checking users lists"
            )

    # make a set of anime_ids
    unique_anime_ids = {entry.anime_id for entry in entries}
    # make an array of anime ids to pass to supabase
    anime_payload = [{"id": anime_id} for anime_id in unique_anime_ids]

    # upsert anime rows first so the ids exist for foreign key checks
    try:
        if anime_payload:
            supabase.table("anime").upsert(anime_payload, on_conflict="id").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anime upsert failed: {e}")

    # payload to sent to list table
    list_payload = {
        "title": payload.title.strip(),
        "genre": payload.genre,
        "description": payload.description,
        "visibility": payload.visibility,
        "amount": len(entries),
        "owner_id": user.id,
    }

    created_list = None
    # add the user list to db
    try:
        list_response = supabase.table("user_list").insert(list_payload).execute()
        if not list_response.data:
            raise HTTPException(status_code=500, detail="List insert failed")
        created_list = list_response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List insert failed: {e}")

    # array of the entries to to place in the database
    entry_payload = [
        {
            "list_id": created_list["id"],
            "anime_id": each_entry.anime_id,
            "rank": each_entry.rank,
            "genre": each_entry.genre,
        }
        for each_entry in entries
    ]

    try:
        # checks if the frontend actually returns entries to be added
        entry_response = (
            supabase.table("user_list_entry").insert(entry_payload).execute()
            if entry_payload
            else None
        )
    except Exception as e:
        try:
            # error handle
            supabase.table("user_list").delete().eq("id", created_list["id"]).execute()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"List entry insert failed: {e}")

    # NOTE: GOING TO LET SUPABASE HANDLE GETTING USER NAME
    list_with_entries = {
        # list data that we get from the list table
        **created_list,
        "owner_username": "Unknown",
        "user_list_entry": entry_response.data if entry_response else [],
    }

    try:
        profile_response = (
            supabase.table("profiles")
            .select("username")
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )
        if profile_response.data:
            list_with_entries["owner_username"] = (
                profile_response.data.get("username") or "Unknown"
            )
    except Exception:
        pass

    list_with_entries.pop("owner_id", None)

    # add the anime data to res
    hydrated_payload = await attach_anime_to_list_entries([list_with_entries])

    return {
        "list": {
            **hydrated_payload[0],
        }
    }

from dotenv import load_dotenv
from fastapi import APIRouter, Header
from fastapi.exceptions import HTTPException
from gotrue.types import User

from database.supabase_client import supabase

from routers.discussions import validate_anime_exists
from schemas.lists import UserListCreate
from utilities.auth_validator import auth_validator


# connect to the router
router = APIRouter()

# might load in variables
load_dotenv()


@router.get("/lists")
async def get_all_lists():
    # access the supabase table
    pass


# protected route
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
@router.post("/create-list")
async def create_list(
    payload: UserListCreate,
    authorization: str = Header(...),
):
    # check if the user is validated (handles raising error) (gets back user obj)
    user: User = auth_validator(authorization)

    # strore the entries to break down
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

    unique_anime_ids = {entry.anime_id for entry in entries}
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

    # make an array of entry obj to put in db
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
        entry_response = (
            supabase.table("user_list_entry").insert(entry_payload).execute()
            if entry_payload
            else None
        )
    except Exception as e:
        try:
            supabase.table("user_list").delete().eq("id", created_list["id"]).execute()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"List entry insert failed: {e}")

    return {
        "list": {
            **created_list,
            "entries": entry_response.data if entry_response else [],
        }
    }

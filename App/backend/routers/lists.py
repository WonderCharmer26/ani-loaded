from copy import Error
from dotenv import load_dotenv
from fastapi import APIRouter, Form, Header
from fastapi.exceptions import HTTPException
from gotrue import User
from starlette.types import HTTPExceptionHandler
import supabase

from routers.discussions import validate_anime_exists
from schemas.lists import UserListEntry, Visibility
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
() @ router.post("/create-list")


async def create_list(
    title: str = Form(),
    genre: str | None = Form(),
    description: str | None = Form(),
    visibility: Visibility = Form(),
    amount: int = Form(),
    entries: list[UserListEntry] = Form(),
    authorization: str = Header(...),
):
    # check if the user is validated (handles raising error)
    user: User = auth_validator(authorization)

    # check the animes chosen (might try to change into a set)
    for each_entry in entries:
        if not validate_anime_exists(each_entry.anime_id):
            raise HTTPException(
                status_code=404,
                detail="anime_id in one or more of the anime entries given was not provided properly",
            )
    # make sure that the userid matches the list table
    try:
        pass
    except Exception as e:
        raise e
    # handle error
    # add users picks into the list
    # handle the errors
    # return the list response
    pass

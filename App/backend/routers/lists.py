
from dotenv import load_dotenv
from fastapi import APIRouter, Header


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

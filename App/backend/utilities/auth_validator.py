from fastapi import HTTPException, Header
from database.supabase_client import supabase

# helper function to help us to check auth
def auth_validator(authorization: str = Header(...)):
    # check to make sure that authorization has bearer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Incorrect authorization header")

    # separate the token
    token = authorization.split(" ")[1]

    # check for user
    userData = supabase.auth.get_user(token)

    # if there is no user raise
    if not userData.user:
        raise HTTPException(status_code=404, detail="You are not a user")

    # return
    return userData.user

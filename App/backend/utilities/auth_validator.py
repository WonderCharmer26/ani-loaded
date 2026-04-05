from fastapi import HTTPException, Header
from typing import Any
from database.supabase_client import supabase

# helper function to help us to check auth
def auth_validator(authorization: str = Header(...)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    # check to make sure that authorization has bearer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Incorrect authorization header")

    # separate the token
    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    # check for user
    try:
        userData: Any = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # if there is no user raise
    user = getattr(userData, "user", None)

    if not user:
        raise HTTPException(status_code=401, detail="You are not a user")

    # return
    return user

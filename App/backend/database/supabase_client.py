import asyncio
import os

from dotenv import load_dotenv
from supabase import AsyncClient, acreate_client

# load
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

_supabase: AsyncClient | None = None
_supabase_lock = asyncio.Lock()


# async function to handle getting the supabase connection when needed
async def get_supabase_client(authorization: str | None = None) -> AsyncClient:
    global _supabase

    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")

    if _supabase is None:
        async with _supabase_lock:
            if _supabase is None:
                _supabase = await acreate_client(url, key)

    if authorization:
        if not authorization.lower().startswith("bearer "):
            raise ValueError("Invalid authorization header format")
        token = authorization.split(" ", 1)[1].strip()
        if not token:
            raise ValueError("Missing bearer token")
        _supabase.postgrest.auth(token)

    return _supabase

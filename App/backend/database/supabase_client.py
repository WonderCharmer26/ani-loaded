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


async def get_supabase_client() -> AsyncClient:
    global _supabase

    if _supabase is not None:
        return _supabase

    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")

    async with _supabase_lock:
        if _supabase is None:
            _supabase = await acreate_client(url, key)

    return _supabase

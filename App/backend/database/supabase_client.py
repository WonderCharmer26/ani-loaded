import asyncio
import inspect
import logging
import os

from dotenv import load_dotenv
from supabase import AsyncClient, acreate_client

logger = logging.getLogger(__name__)

# load
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

_supabase: AsyncClient | None = None
_supabase_lock = asyncio.Lock()


def _mask_token(token: str) -> str:
    if len(token) <= 12:
        return "***"
    return f"{token[:8]}...{token[-4:]}"


# help with tracking the auth state on requests when debugging
def _log_client_auth_state(client: AsyncClient, context: str) -> None:
    auth_header = client.postgrest.session.headers.get("Authorization")
    api_key = client.postgrest.session.headers.get("apikey")
    logger.info(
        "Supabase client auth state",
        extra={
            "context": context,
            "has_authorization_header": bool(auth_header),
            "authorization_preview": _mask_token(auth_header) if auth_header else None,
            "has_apikey_header": bool(api_key),
        },
    )


async def _create_client() -> AsyncClient:
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
    return await acreate_client(url, key)


async def close_supabase_client(client: AsyncClient) -> None:
    close_operations = (
        client.postgrest.aclose,
        client.storage.session.aclose,
        client.auth.close,
        client.realtime.close,
    )
    for close_operation in close_operations:
        result = close_operation()
        if inspect.isawaitable(result):
            await result


async def close_shared_supabase_client() -> None:
    global _supabase

    if _supabase is not None:
        await close_supabase_client(_supabase)
        _supabase = None


# async function to handle getting the supabase connection when needed
async def get_supabase_client(authorization: str | None = None) -> AsyncClient:
    global _supabase

    if authorization:
        if not authorization.lower().startswith("bearer "):
            raise ValueError("Invalid authorization header format")
        token = authorization.split(" ", 1)[1].strip()
        if not token:
            raise ValueError("Missing bearer token")

        client = await _create_client()
        client.postgrest.auth(token)
        _log_client_auth_state(client, "authenticated_client_created")
        return client

    if _supabase is None:
        async with _supabase_lock:
            if _supabase is None:
                _supabase = await _create_client()
                _log_client_auth_state(_supabase, "shared_client_created")

    return _supabase

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import UUID

from agents.recommendation_agent import run_recommendation_agent
from database.supabase_client import close_supabase_client, get_supabase_client
from fastapi import APIRouter, Header
from fastapi.exceptions import HTTPException
from gotrue.types import User
from pydantic import BaseModel
from rag.rag_service import get_filtered_recommendations
from schemas.chat import ChatMessage, ChatSession, ChatSessionWithMessages
from schemas.recommendations import MatchedAnimeResponse
from supabase import AsyncClient
from utilities.auth_validator import auth_validator

router = APIRouter()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def request_supabase_client(
    authorization: str,
) -> AsyncIterator[AsyncClient]:
    client = await get_supabase_client(authorization)
    try:
        yield client
    finally:
        await close_supabase_client(client)


class RecommendationMessageRequest(BaseModel):
    content: str


def _generate_conversation_title(content: str) -> str:
    normalized_content = " ".join(content.split())
    max_length = 80
    if len(normalized_content) <= max_length:
        return normalized_content
    return f"{normalized_content[: max_length - 3].rstrip()}..."


def _preview_content(content: str, max_length: int = 120) -> str:
    if len(content) <= max_length:
        return content
    return f"{content[: max_length - 3].rstrip()}..."


async def _get_session_for_user(
    session_id: UUID, user_id: str, supabase: AsyncClient
) -> ChatSession:
    try:
        response = await (
            supabase.table("chat_sessions")
            .select("*")
            .eq("id", str(session_id))
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as exc:
        if getattr(exc, "code", None) == "PGRST116":
            raise HTTPException(
                status_code=404, detail="Conversation not found"
            ) from exc
        raise

    if not response.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ChatSession.model_validate(response.data)


async def _get_session_messages(
    session_id: UUID, supabase: AsyncClient
) -> list[ChatMessage]:
    response = await (
        supabase.table("chat_messages")
        .select("*")
        .eq("session_id", str(session_id))
        .order("created_at")
        .execute()
    )
    return [ChatMessage.model_validate(message) for message in response.data or []]


async def _get_session_with_messages(
    session_id: UUID, user_id: str, supabase: AsyncClient
) -> ChatSessionWithMessages:
    session = await _get_session_for_user(session_id, user_id, supabase)
    messages = await _get_session_messages(session_id, supabase)
    return ChatSessionWithMessages(**session.model_dump(), messages=messages)


# Returns the current user's recommendation chat sessions, newest activity first.
@router.get("/recommendations/conversations", response_model=list[ChatSession])
async def get_recommendation_conversations(
    authorization: str = Header(...),
):
    user: User = await auth_validator(authorization)

    try:
        async with request_supabase_client(authorization) as supabase:
            response = await (
                supabase.table("chat_sessions")
                .select("*")
                .eq("user_id", str(user.id))
                .order("last_active_at", desc=True)
                .order("created_at", desc=True)
                .execute()
            )
        return [ChatSession.model_validate(session) for session in response.data or []]
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to load recommendation conversations",
        ) from exc


# Creates a new empty recommendation conversation for the authenticated user.
@router.post("/recommendations/conversations", response_model=ChatSession)
async def create_recommendation_conversation(
    authorization: str = Header(...),
):
    user: User = await auth_validator(authorization)

    try:
        async with request_supabase_client(authorization) as supabase:
            response = await (
                supabase.table("chat_sessions")
                .insert(
                    {
                        "user_id": str(user.id),
                        "title": None,
                        "status": "active",
                        "message_count": 0,
                        "last_active_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                .execute()
            )
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Unable to create recommendation conversation",
            )
        return ChatSession.model_validate(response.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to create recommendation conversation",
        ) from exc


# Loads one recommendation conversation along with its full message history.
@router.get(
    "/recommendations/conversations/{session_id}",
    response_model=ChatSessionWithMessages,
)
async def get_recommendation_conversation(
    session_id: UUID,
    authorization: str = Header(...),
):
    user: User = await auth_validator(authorization)

    try:
        async with request_supabase_client(authorization) as supabase:
            return await _get_session_with_messages(session_id, str(user.id), supabase)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to load recommendation conversation",
        ) from exc


# Stores a user message, runs the recommendation agent, and returns the updated conversation.
@router.post(
    "/recommendations/conversations/{session_id}/messages",
    response_model=ChatSessionWithMessages,
)
async def send_recommendation_message(
    session_id: UUID,
    payload: RecommendationMessageRequest,
    authorization: str = Header(...),
):
    user: User = await auth_validator(authorization)
    content = " ".join(payload.content.split())

    if not content:
        raise HTTPException(status_code=400, detail="Message content is required")

    pipeline_stage = "persist_user_message"
    recent_messages: list[ChatMessage] = []
    filtered_results: list[MatchedAnimeResponse] = []

    try:
        async with request_supabase_client(authorization) as supabase:
            session = await _get_session_for_user(session_id, str(user.id), supabase)

            auth_header = supabase.postgrest.session.headers.get("Authorization")
            logger.info(
                "Recommendation route Supabase auth check",
                extra={
                    "pipeline_stage": pipeline_stage,
                    "session_id": str(session_id),
                    "user_id": str(user.id),
                    "has_authorization_header": bool(auth_header),
                    "authorization_preview": (
                        f"{auth_header[:16]}...{auth_header[-6:]}"
                        if auth_header
                        else None
                    ),
                },
            )

            # adds the chat message
            await (
                supabase.table("chat_messages")
                .insert(
                    {
                        "session_id": str(session_id),
                        "role": "user",
                        "content": content,
                    }
                )
                .execute()
            )

            # create and add chat title if it doesn't exist
            pipeline_stage = "update_session_title"
            if not session.title:
                await (
                    supabase.table("chat_sessions")
                    .update({"title": _generate_conversation_title(content)})
                    .eq("id", str(session_id))
                    .execute()
                )

            # get recent session messages
            pipeline_stage = "load_session_messages"
            session_messages = await _get_session_messages(session_id, supabase)
            recent_messages = session_messages[-12:]

            pipeline_stage = "filter_recommendations"
            filtered_results = await get_filtered_recommendations(
                str(user.id), content, supabase=supabase
            )
            logger.info(
                "Prepared filtered recommendation candidates",
                extra={
                    "pipeline_stage": pipeline_stage,
                    "session_id": str(session_id),
                    "user_id": str(user.id),
                    "filtered_result_count": len(filtered_results),
                    "filtered_result_titles": [
                        result.title for result in filtered_results[:5]
                    ],
                },
            )

            pipeline_stage = "run_recommendation_agent"
            response_text = await run_recommendation_agent(
                user_id=str(user.id),
                filtered_anime_suggestions=filtered_results,
                session_messages=recent_messages,
                authorization=authorization,
            )

            pipeline_stage = "persist_assistant_message"
            await (
                supabase.table("chat_messages")
                .insert(
                    {
                        "session_id": str(session_id),
                        "role": "assistant",
                        "content": response_text,
                    }
                )
                .execute()
            )

            pipeline_stage = "update_session_metadata"
            await (
                supabase.table("chat_sessions")
                .update(
                    {
                        "message_count": session.message_count + 2,
                        "last_active_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                .eq("id", str(session_id))
                .execute()
            )

            pipeline_stage = "load_updated_conversation"
            return await _get_session_with_messages(session_id, str(user.id), supabase)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Recommendation message pipeline failed",
            extra={
                "pipeline_stage": pipeline_stage,
                "session_id": str(session_id),
                "user_id": str(user.id),
                "message_preview": _preview_content(content),
                "recent_message_count": len(recent_messages),
                "filtered_result_count": len(filtered_results),
            },
        )
        raise HTTPException(
            status_code=500,
            detail="Recommendation agent failed",
        ) from exc

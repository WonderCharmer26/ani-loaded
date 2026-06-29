from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Header
from fastapi.exceptions import HTTPException
from gotrue.types import User
from pydantic import BaseModel

from agents.recommendation_agent import run_recommendation_agent
from database.supabase_client import get_supabase_client
from rag.rag_service import get_filtered_recommendations
from schemas.chat import ChatMessage, ChatSession, ChatSessionWithMessages
from schemas.recommendations import MatchedAnimeResponse
from utilities.auth_validator import auth_validator

router = APIRouter()


class RecommendationMessageRequest(BaseModel):
    content: str


def _generate_conversation_title(content: str) -> str:
    normalized_content = " ".join(content.split())
    max_length = 80
    if len(normalized_content) <= max_length:
        return normalized_content
    return f"{normalized_content[: max_length - 3].rstrip()}..."


async def _get_session_for_user(session_id: UUID, user_id: str) -> ChatSession:
    supabase = await get_supabase_client()
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
            raise HTTPException(status_code=404, detail="Conversation not found") from exc
        raise

    if not response.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ChatSession.model_validate(response.data)


async def _get_session_messages(session_id: UUID) -> list[ChatMessage]:
    supabase = await get_supabase_client()
    response = await (
        supabase.table("chat_messages")
        .select("*")
        .eq("session_id", str(session_id))
        .order("created_at")
        .execute()
    )
    return [ChatMessage.model_validate(message) for message in response.data or []]


async def _get_session_with_messages(
    session_id: UUID, user_id: str
) -> ChatSessionWithMessages:
    session = await _get_session_for_user(session_id, user_id)
    messages = await _get_session_messages(session_id)
    return ChatSessionWithMessages(**session.model_dump(), messages=messages)


@router.get("/recommendations/conversations", response_model=list[ChatSession])
async def get_recommendation_conversations(
    authorization: str = Header(...),
):
    user: User = await auth_validator(authorization)
    supabase = await get_supabase_client()

    try:
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


@router.post("/recommendations/conversations", response_model=ChatSession)
async def create_recommendation_conversation(
    authorization: str = Header(...),
):
    user: User = await auth_validator(authorization)
    supabase = await get_supabase_client()

    try:
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
        return await _get_session_with_messages(session_id, str(user.id))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to load recommendation conversation",
        ) from exc


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

    session = await _get_session_for_user(session_id, str(user.id))
    supabase = await get_supabase_client()

    try:
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

        if not session.title:
            await (
                supabase.table("chat_sessions")
                .update({"title": _generate_conversation_title(content)})
                .eq("id", str(session_id))
                .execute()
            )

        session_messages = await _get_session_messages(session_id)
        recent_messages = session_messages[-12:]

        filtered_results: list[MatchedAnimeResponse] = await get_filtered_recommendations(
            str(user.id), content
        )
        response_text = await run_recommendation_agent(
            user_id=str(user.id),
            filtered_anime_suggestions=filtered_results,
            session_messages=recent_messages,
        )

        await (
            supabase.table("chat_messages")
            .insert(
                {
                    "session_id": str(session_id),
                    "role": "agent",
                    "content": response_text,
                }
            )
            .execute()
        )

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

        return await _get_session_with_messages(session_id, str(user.id))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Recommendation agent failed",
        ) from exc

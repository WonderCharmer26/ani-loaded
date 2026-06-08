from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# enums
ChatSessionStatus = Literal["active", "expired"]
ChatMessageRole = Literal["user", "agent"]


class ChatSession(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: ChatSessionStatus = "active"
    message_count: int = Field(default=0, ge=0)
    reset_at: datetime | None = None
    created_at: datetime | None = None
    last_active_at: datetime | None = None


class ChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    role: ChatMessageRole
    content: str
    created_at: datetime | None = None


class ChatSessionWithMessages(ChatSession):
    messages: list[ChatMessage] = Field(default_factory=list)

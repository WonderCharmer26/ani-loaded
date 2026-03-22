from typing import Optional, Literal
from uuid import UUID

from pydantic import BaseModel


# For the type of post
Visibility = Literal["public", "private"]


# anime gotten from anilist
class UserListEntryCreate(BaseModel):
    anime_id: int
    rank: Optional[int] = None
    genre: Optional[str] = None


# for the list request that the user wants to put in the database
class UserListCreate(BaseModel):
    title: str
    genre: Optional[str] = None
    description: Optional[str] = None
    visibility: Visibility
    amount: int
    entries: list[UserListEntryCreate]


# Anime entry that was chosen to send to the backend
class UserListEntry(BaseModel):
    id: UUID
    list_id: UUID
    anime_id: int
    rank: Optional[int] = None
    genre: Optional[str] = None
    created_at: str


# the users list the users gets back for the response
class UserList(BaseModel):
    id: UUID
    title: str
    genre: Optional[str] = None
    description: Optional[str] = None
    visibility: Visibility
    owner_id: UUID
    created_at: str
    updated_at: str
    amount: int
    entries: list[UserListEntry]

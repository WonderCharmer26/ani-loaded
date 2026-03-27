from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from gotrue import ConfigDict
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
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    list_id: UUID
    anime_id: int
    rank: Optional[int] = None
    genre: Optional[str] = None
    created_at: datetime


# responses for the user lists that I send off
class UserList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    genre: Optional[str] = None
    description: Optional[str] = None
    visibility: Visibility
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    amount: int
    user_list_entry: list[UserListEntry] = []


# NOTE: CREATE THE USER LIST RESPONSE SCHEMA TO STRUCTURE THE DATA

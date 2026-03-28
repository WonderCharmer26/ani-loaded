from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from gotrue import ConfigDict
from pydantic import BaseModel, PositiveInt
from schemas.anilist import AniListMedia


# For the type of post
Visibility = Literal["public", "private"]


# anime gotten from anilist
class UserListEntryCreate(BaseModel):
    list_id: Optional[UUID]
    anime_id: PositiveInt
    rank: PositiveInt | None
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
    # helps us validate the data structure before sending back the data response
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    list_id: UUID
    anime_id: int
    rank: Optional[int] = None
    genre: Optional[str] = None
    created_at: datetime


class UserListEntryWithAnime(UserListEntry):
    anime: AniListMedia | None = None


# responses for the user lists that I want to get back
class UserList(BaseModel):
    # helps us validate the data structure before sending back the data response
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    genre: Optional[str] = None
    description: Optional[str] = None
    visibility: Visibility
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    amount: PositiveInt
    user_list_entry: list[UserListEntry] = []


class UserListWithAnime(UserList):
    user_list_entry: list[UserListEntryWithAnime] = []


class UserListResponseWrapper(BaseModel):
    list: UserListWithAnime


# NOTE: CREATE THE USER LIST RESPONSE SCHEMA TO STRUCTURE THE DATA

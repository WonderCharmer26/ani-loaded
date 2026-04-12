from typing import Optional
from fastapi import UploadFile
from pydantic import BaseModel
from uuid import UUID


# Discussions Model
class Discussions(BaseModel):
    id: UUID
    anime_id: int
    category_id: UUID
    created_by: UUID  # might make into a string depending on how supabase sets it up
    title: str
    body: str
    thumbnail_url: Optional[str]
    thumbnail_path: Optional[str]
    is_locked: bool
    is_pinned: bool  # might not need
    is_spoiler: bool
    episode_number: Optional[int]
    created_at: str
    last_activity_at: str
    comment_count: int
    upvote_count: int
    season_number: Optional[int]


# function for the discussion posting
class DiscussionsRequest(BaseModel):
    id: str
    anime_id: int
    category_id: Optional[UUID]
    created_by: Optional[UUID]  # make required after integrating with user
    title: str
    body: str
    thumbnail: Optional[UploadFile]  # will be a file sent to the backend
    is_locked: bool
    is_spoiler: bool
    episode_number: Optional[int]
    season_number: Optional[int]


# Discussions Comments
class DiscussionComments(BaseModel):
    id: UUID
    discussion_id: UUID
    created_by: str
    created_by_username: Optional[str]
    parent_comment_id: UUID
    body: str
    is_spoiler: bool
    created_at: str
    updated_at: str


# Discussions Categories
class DiscussionCategories(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str
    sort_order: int
    is_active: bool
    created_at: str


class DiscussionsResponse(BaseModel):
    data: list[Discussions]
    total: Optional[int]


# Request model for submitting a comment
class CommentRequest(BaseModel):
    body: str
    is_spoiler: bool = False
    parent_comment_id: Optional[str] = None


# Request model for updating a discussion
class DiscussionUpdateRequest(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    is_spoiler: Optional[bool] = None
    is_locked: Optional[bool] = None

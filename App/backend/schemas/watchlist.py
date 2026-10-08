from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, PositiveInt


WatchlistStatus = Literal[
    "plan_to_watch",
    "completed",
    "on_hold",
    "watching",
    "dropped",
]


class UserWatchlistRequest(BaseModel):
    anime_id: PositiveInt
    title: str
    genres: list[str]
    status: WatchlistStatus


class UserWatchlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    anime_id: PositiveInt
    title: str
    genres: list[str]
    status: WatchlistStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UserWatchlistListResponse(BaseModel):
    watchlist: list[UserWatchlistResponse]


class UserWatchlistExistsResponse(BaseModel):
    in_watchlist: bool
    item: UserWatchlistResponse | None = None


class UserWatchlistSuccessMessage(BaseModel):
    message: str


class UserWatchlistStatusUpdateRequest(BaseModel):
    status: WatchlistStatus


class UserWatchlistStatusResponse(BaseModel):
    anime_id: PositiveInt
    in_watchlist: bool
    status: WatchlistStatus | None = None

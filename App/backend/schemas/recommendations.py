from pydantic import BaseModel, ConfigDict, PositiveInt


# RPC Function Response Type
class MatchedAnimeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: PositiveInt
    title: str
    genres: list[str]
    description: str | None = None
    average_score: int | None = None
    cover_url: str | None = None

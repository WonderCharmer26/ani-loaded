from fastapi import APIRouter, Header
from fastapi.exceptions import HTTPException
from gotrue.types import User
from pydantic import BaseModel

from agents.recommendation_agent import run_recommendation_agent
from utilities.auth_validator import auth_validator

router = APIRouter()


# Request body schema — the frontend sends this as JSON
class RecommendationRequest(BaseModel):
    user_message: str  # e.g. "I want something with dark themes and complex characters"


@router.post("/recommendations/agent")
async def get_agent_recommendations(
    payload: RecommendationRequest,
    authorization: str = Header(...),
):
    """
    Protected route — requires a valid Bearer token.
    Runs the recommendation agent and returns its response.
    """

    # Validate the token and get the user object back (same pattern as your other routes)
    user: User = await auth_validator(authorization)

    try:
        # TODO: LOOK INTO TOOL CALLING AND MAKING SURE THAT WORKS AS WELL.
        response = await run_recommendation_agent(
            user_id=str(user.id),
            user_message=payload.user_message,
        )
        return {"response": response}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation agent failed: {e}",
        )

import logging

from langchain_openai import ChatOpenAI
from langchain.agents import create_agent

# tools that I made for searching for needed info
from schemas.chat import ChatMessage
from agents.tools import search_similar_anime
from schemas.recommendations import MatchedAnimeResponse

logger = logging.getLogger(__name__)

# gonna add more tooling later on
_tools = [search_similar_anime]


def get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model="gpt-4o", temperature=0
    )  # might tweak the temp in for a better creativity on the response from the agent


def get_recommendation_agent():
    return create_agent(model=get_llm(), tools=_tools)

# TODO: Tweak the system prompt
_SYSTEM_PROMPT = """
You are an anime recommendation assistant for AniLoaded.

The current user's ID is {user_id}.

Here are the list of anime recommendation options to choose from based on the users watch history and shows that matched the users request that have been filtered:
{filtered_anime_suggestions}

The array of anime suggestions to recommend have already been prefiltered to be shows that the use has not seen.
They should already have the information that you would need to recommend them to the user.
Make recommendations using these anime as options to show the user.
Return no more than 5 recommendations maximum. For each one include:
   - Title
   - Genres
   - A short 1-2 sentence reason why it matches what the user is looking for
   - Average score if available

Be concise and helpful.
"""


# Orchastration agent - calls the tools that we set up what it needs to give the recommendation
async def run_recommendation_agent(
    user_id: str,
    filtered_anime_suggestions: list[MatchedAnimeResponse],
    session_messages: list[ChatMessage],
) -> str:
    """
    Takes the user's ID and their message, runs the full agent loop,
    and returns the final text response.
    """

    # add in a fuction to get the users username from the database and then add it in the system prompt
    # might be able to get it from the supabase function that gets the user information

    try:
        agent = get_recommendation_agent()
        result = await agent.ainvoke(
            {
                "messages": [
                    # System message sets the agent's behavior for this specific user
                    (
                        "system",
                        _SYSTEM_PROMPT.format(
                            user_id=user_id,
                            filtered_anime_suggestions=filtered_anime_suggestions,
                        ),
                    ),
                    *[(message.role, message.content) for message in session_messages],
                ]
            }
        )
    except Exception:
        logger.exception(
            "Recommendation agent invocation failed",
            extra={
                "user_id": user_id,
                "session_message_count": len(session_messages),
                "filtered_suggestion_count": len(filtered_anime_suggestions),
            },
        )
        raise

    # return the last message for the agents last answer
    return result["messages"][-1].content

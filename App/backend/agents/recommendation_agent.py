from langchain_openai import ChatOpenAI
from langchain.agents import create_agent

# tools that I made for searching for needed info
from agents.tools import search_similar_anime, get_completed_watchlist

# model that we'll use
_llm = ChatOpenAI(
    model="gpt-4o", temperature=0
)  # might tweak the temp in for a better creativity on the response from the agent

# gonna add more tooling later on
_tools = [search_similar_anime, get_completed_watchlist]

# create_agent builds the LangGraph state machine that runs the agent loop:
#   reason → call tool → observe result → reason again → ... → final answer
# handles all the looping so we don't have to do it manually.
_agent = create_agent(model=_llm, tools=_tools)

# might add in the users username instead
_SYSTEM_PROMPT = """
You are an anime recommendation assistant for AniLoaded.

The current user's ID is {user_id}.

Follow these steps every time:
1. Always call get_completed_watchlist first so you know what the user has already seen.
2. Use search_similar_anime with a rich, descriptive query based on what the user is asking for.
   Do not use short queries like "action anime" — be specific: "intense action with complex characters and dark themes".
3. Filter out any results whose anilist_id appears in the user's watched list.
4. Return 5 recommendations maximum. For each one include:
   - Title
   - Genres
   - A short 1-2 sentence reason why it matches what the user is looking for
   - Average score if available

Be concise and helpful. Do not recommend anime the user has already seen.
"""


# Orchastration agent - calls the tools that we set up what it needs to give the recommendation
async def run_recommendation_agent(user_id: str, user_message: str) -> str:
    """
    Takes the user's ID and their message, runs the full agent loop,
    and returns the final text response.
    """

    # add in a fuction to get the users username from the database and then add it in the system prompt

    result = await _agent.ainvoke(
        {
            "messages": [
                # System message sets the agent's behavior for this specific user
                ("system", _SYSTEM_PROMPT.format(user_id=user_id)),
                # The user's actual request
                ("user", user_message),
            ]
        }
    )

    # return the last message for the agents last answer
    return result["messages"][-1].content

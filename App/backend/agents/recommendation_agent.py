from langchain_openai import ChatOpenAI
from langchain.agents import create_react_agent

# tools that I made for searching for needed info
from agents.tools import search_similar_anime, get_user_watched_list

# NOTE: MIGHT EDIT THE TEMP TO MAKE IT MORE CREATIVE
_llm = ChatOpenAI(model="gpt-4o", temperature=0)

# ill, add new tools to the array later on
_tools = [search_similar_anime, get_user_watched_list]

# create_react_agent builds the LangGraph state machine that runs the agent loop:
#   reason → call tool → observe result → reason again → ... → final answer
# This replaces the manual while True loop we described earlier.
_agent = create_react_agent(model=_llm, tools=_tools)

# The system prompt shapes how the agent thinks and what it prioritizes.
# {user_id} is a placeholder we fill in at runtime for each request.
_SYSTEM_PROMPT = """
You are an anime recommendation assistant for AniLoaded.

The current user's ID is {user_id}.

Follow these steps every time:
1. Always call get_user_watched_list first so you know what the user has already seen.
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


async def run_recommendation_agent(user_id: str, user_message: str) -> str:
    """
    Takes the user's ID and their message, runs the full agent loop,
    and returns the final text response.
    """

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

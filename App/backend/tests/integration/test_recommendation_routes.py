"""Integration tests for the recommendations router."""

from unittest.mock import AsyncMock

from tests.helpers.mock_factories import (
    make_chat_message_row,
    make_chat_session_row,
    make_closeable_supabase_builder,
    make_fake_user,
    make_supabase_builder,
    make_supabase_response,
)


def _auth_headers(token: str = "test-token") -> dict:
    return {"Authorization": f"Bearer {token}"}


async def test_get_recommendation_conversations_returns_sessions(
    async_client, monkeypatch
):
    fake_user = make_fake_user()
    sessions = [make_chat_session_row(title="Dark fantasy recs")]
    builder = make_supabase_builder(execute_data=sessions)

    monkeypatch.setattr(
        "routers.recommendations.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.recommendations.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get(
        "/recommendations/conversations", headers=_auth_headers()
    )

    assert response.status_code == 200
    assert response.json()[0]["title"] == "Dark fantasy recs"


async def test_create_recommendation_conversation_returns_created_session(
    async_client, monkeypatch
):
    fake_user = make_fake_user()
    session_row = make_chat_session_row()
    builder = make_supabase_builder(execute_data=[session_row])

    monkeypatch.setattr(
        "routers.recommendations.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.recommendations.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.post(
        "/recommendations/conversations", headers=_auth_headers()
    )

    assert response.status_code == 200
    assert response.json()["id"] == session_row["id"]
    assert response.json()["message_count"] == 0


async def test_get_recommendation_conversation_returns_messages(
    async_client, monkeypatch
):
    fake_user = make_fake_user()
    session_row = make_chat_session_row(title="Need thriller recs")
    message_row = make_chat_message_row(session_id=session_row["id"])
    builder = make_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response(session_row),
            make_supabase_response([message_row]),
        ]
    )

    monkeypatch.setattr(
        "routers.recommendations.auth_validator", AsyncMock(return_value=fake_user)
    )
    monkeypatch.setattr(
        "routers.recommendations.get_supabase_client", AsyncMock(return_value=builder)
    )

    response = await async_client.get(
        f"/recommendations/conversations/{session_row['id']}",
        headers=_auth_headers(),
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Need thriller recs"
    assert len(response.json()["messages"]) == 1


async def test_get_recommendation_conversation_not_found_returns_404(
    async_client, monkeypatch
):
    class _PGRST116Error(Exception):
        code = "PGRST116"

    fake_user = make_fake_user()
    builder = make_supabase_builder()
    builder.execute.side_effect = _PGRST116Error("Not found")

    monkeypatch.setattr(
        "routers.recommendations.auth_validator", AsyncMock(return_value=fake_user)
    )
    get_client = AsyncMock(return_value=builder)
    monkeypatch.setattr("routers.recommendations.get_supabase_client", get_client)

    response = await async_client.get(
        "/recommendations/conversations/00000000-0000-0000-0000-000000000101",
        headers=_auth_headers(),
    )

    assert response.status_code == 404


async def test_send_recommendation_message_creates_assistant_exchange(
    async_client, monkeypatch
):
    fake_user = make_fake_user()
    session_row = make_chat_session_row()
    titled_session_row = make_chat_session_row(
        title="Looking for dark fantasy anime", message_count=2
    )
    user_message_row = make_chat_message_row(content="Looking for dark fantasy anime")
    assistant_message_row = make_chat_message_row(
        id="00000000-0000-0000-0000-000000000202",
        role="assistant",
        content="Try Berserk and Claymore.",
    )
    builder = make_closeable_supabase_builder()
    builder.execute = AsyncMock(
        side_effect=[
            make_supabase_response(session_row),
            make_supabase_response([user_message_row]),
            make_supabase_response([titled_session_row]),
            make_supabase_response([user_message_row]),
            make_supabase_response([assistant_message_row]),
            make_supabase_response([titled_session_row]),
            make_supabase_response(titled_session_row),
            make_supabase_response([user_message_row, assistant_message_row]),
        ]
    )

    monkeypatch.setattr(
        "routers.recommendations.auth_validator", AsyncMock(return_value=fake_user)
    )
    get_client = AsyncMock(return_value=builder)
    monkeypatch.setattr("routers.recommendations.get_supabase_client", get_client)
    filtered_recommendations = AsyncMock(return_value=[])
    monkeypatch.setattr(
        "routers.recommendations.get_filtered_recommendations",
        filtered_recommendations,
    )
    monkeypatch.setattr(
        "routers.recommendations.run_recommendation_agent",
        AsyncMock(return_value="Try Berserk and Claymore."),
    )

    response = await async_client.post(
        f"/recommendations/conversations/{session_row['id']}/messages",
        json={"content": "Looking for dark fantasy anime"},
        headers=_auth_headers(),
    )

    body = response.json()
    assert response.status_code == 200
    assert body["title"] == "Looking for dark fantasy anime"
    assert body["message_count"] == 2
    assert [message["role"] for message in body["messages"]] == ["user", "assistant"]
    assert builder.update.call_args_list[0].args[0]["title"] == "Looking for dark fantasy anime"
    assert builder.update.call_args_list[1].args[0]["message_count"] == 2
    get_client.assert_awaited_once_with("Bearer test-token")
    filtered_recommendations.assert_awaited_once_with(
        str(fake_user.id),
        "Looking for dark fantasy anime",
        supabase=builder,
    )
    builder.postgrest.aclose.assert_awaited_once()
    builder.storage.session.aclose.assert_awaited_once()
    builder.auth.close.assert_awaited_once()
    builder.realtime.close.assert_awaited_once()


async def test_send_recommendation_message_rejects_blank_content(
    async_client, monkeypatch
):
    fake_user = make_fake_user()

    monkeypatch.setattr(
        "routers.recommendations.auth_validator", AsyncMock(return_value=fake_user)
    )

    response = await async_client.post(
        "/recommendations/conversations/00000000-0000-0000-0000-000000000101/messages",
        json={"content": "   "},
        headers=_auth_headers(),
    )

    assert response.status_code == 400

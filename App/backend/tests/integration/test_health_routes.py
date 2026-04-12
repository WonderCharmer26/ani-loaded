"""Integration tests for the health router (GET /)."""


async def test_get_root_returns_200(async_client):
    response = await async_client.get("/")
    assert response.status_code == 200


async def test_get_root_contains_test_message_key(async_client):
    response = await async_client.get("/")
    data = response.json()
    assert "test_message" in data


async def test_get_root_message_is_string(async_client):
    response = await async_client.get("/")
    assert isinstance(response.json()["test_message"], str)

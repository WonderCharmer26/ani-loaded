"""Unit tests for the season helpers in routers/anime.py."""

from routers.anime import (
    _build_season_query,
    _find_related_season,
    _season_summary,
)


def _edge(relation_type: str, node_id: int, fmt: str = "TV", media_type: str = "ANIME"):
    return {
        "relationType": relation_type,
        "node": {"id": node_id, "type": media_type, "format": fmt},
    }


# ---------------------------------------------------------------------------
# _build_season_query
# ---------------------------------------------------------------------------

def test_build_season_query_nests_relations_to_depth():
    query = _build_season_query(depth=3)
    assert query.count("relations {") == 3


def test_build_season_query_depth_zero_has_no_relations():
    assert "relations" not in _build_season_query(depth=0)


# ---------------------------------------------------------------------------
# _find_related_season
# ---------------------------------------------------------------------------

def test_find_related_season_returns_matching_sequel():
    media = {"relations": {"edges": [_edge("SEQUEL", 2)]}}
    assert _find_related_season(media, "SEQUEL")["id"] == 2


def test_find_related_season_skips_movies_and_other_relations():
    media = {
        "relations": {
            "edges": [
                _edge("SEQUEL", 2, fmt="MOVIE"),
                _edge("SIDE_STORY", 3),
                _edge("SEQUEL", 4, media_type="MANGA"),
            ]
        }
    }
    assert _find_related_season(media, "SEQUEL") is None


def test_find_related_season_handles_missing_relations():
    assert _find_related_season({}, "PREQUEL") is None
    assert _find_related_season({"relations": None}, "PREQUEL") is None


# ---------------------------------------------------------------------------
# _season_summary
# ---------------------------------------------------------------------------

def test_season_summary_finished_uses_total_episodes():
    summary = _season_summary(
        {"id": 1, "title": {"english": "Frieren"}, "status": "FINISHED", "episodes": 28},
        season_number=1,
    )
    assert summary["season_number"] == 1
    assert summary["title"] == "Frieren"
    assert summary["aired_episodes"] == 28


def test_season_summary_airing_counts_only_aired_episodes():
    summary = _season_summary(
        {"id": 2, "status": "RELEASING", "episodes": 12, "nextAiringEpisode": {"episode": 5}},
        season_number=2,
    )
    assert summary["aired_episodes"] == 4


def test_season_summary_not_yet_released_has_no_episodes():
    summary = _season_summary(
        {"id": 3, "status": "NOT_YET_RELEASED", "episodes": 12},
        season_number=3,
    )
    assert summary["aired_episodes"] == 0


def test_season_summary_includes_display_fields():
    summary = _season_summary(
        {
            "id": 5,
            "title": {"english": "Frieren Season 2", "romaji": "Sousou no Frieren 2"},
            "coverImage": {"large": "large.jpg", "medium": "medium.jpg", "color": "#fff"},
            "genres": ["Adventure"],
            "season": "WINTER",
            "seasonYear": 2026,
        },
        season_number=2,
    )
    assert summary["title_english"] == "Frieren Season 2"
    assert summary["title_romaji"] == "Sousou no Frieren 2"
    assert summary["cover_image"] == {"large": "large.jpg", "medium": "medium.jpg"}
    assert summary["genres"] == ["Adventure"]
    assert summary["season"] == "WINTER"


def test_season_summary_handles_missing_cover_and_genres():
    summary = _season_summary({"id": 6}, season_number=1)
    assert summary["cover_image"] == {"large": None, "medium": None}
    assert summary["genres"] == []


def test_season_summary_falls_back_to_romaji_title():
    summary = _season_summary(
        {"id": 4, "title": {"english": None, "romaji": "Sousou no Frieren"}},
        season_number=1,
    )
    assert summary["title"] == "Sousou no Frieren"
    assert summary["aired_episodes"] == 0

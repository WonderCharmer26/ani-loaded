import os
import uuid
from gotrue.types import User
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Body, File, Form, Header, Query, UploadFile
from fastapi.exceptions import HTTPException
from database.supabase_client import supabase
from schemas.discussions import CommentRequest, DiscussionUpdateRequest, DiscussionsResponse
from utilities.auth_validator import auth_validator
from utilities.genreFunctions import ANILIST_URL
from utilities.fileFunctions import ext_from_filename


# Api router
router = APIRouter()

# load in env
load_dotenv()

# key for the storage container in supabase
storage_key_discussion = os.getenv("STORAGE_KEY_DISCUSSION")


# AniList query to check if the anime exists
ANILIST_MEDIA_EXISTS_QUERY = """
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
  }
}
"""


# helper function to clean up word 
def normalize_optional_text(value: str | None) -> str | None:
    # account for no word
    if value is None:
        return None

    # get rid of unwanted white space from the start and end of the phrase
    stripped = value.strip()
    # return
    return stripped or None


# TODO: refactor this into another file
# validator function to check if the anime from the form is in the database
async def validate_anime_exists(anime_id: int) -> bool:
    """Validate that an anime exists in AniList by ID."""
    # try to request
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # send request
            response = await client.post(
                ANILIST_URL,
                json={
                    "query": ANILIST_MEDIA_EXISTS_QUERY,
                    "variables": {"id": anime_id},
                },
                headers={"Content-Type": "application/json"},
            )
            # error checks
            response.raise_for_status()

            # res
            data = response.json()

            if "errors" in data:
                return False

            return data.get("data", {}).get("Media") is not None
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"AniList validation failed: {error.response.status_code}"
                ),
            )
        except httpx.RequestError as error:
            raise HTTPException(
                status_code=503,
                detail=f"AniList validation request error: {error}",
            )


# gets all the discussions from the database with optional search, filter, and sort
@router.get("/discussions", response_model=DiscussionsResponse)
async def get_discussions(
    search: str | None = Query(None, description="Search by title keyword"),
    category_id: str | None = Query(None, description="Filter by category ID"),
    anime_id: int | None = Query(None, description="Filter by anime ID"),
    sort: str = Query("newest", description="Sort by: newest, oldest, most_upvoted, most_commented"),
):
    """
    This function returns all the discussions for the discussions page
    """
    try:
        # start query
        query = supabase.table("discussions").select("*")

        # apply category filter
        if category_id:
            query = query.eq("category_id", category_id)

        # apply anime filter
        if anime_id:
            query = query.eq("anime_id", anime_id)

        # apply search filter (case-insensitive partial match)
        if search:
            query = query.ilike("title", f"%{search}%")

        # apply sort
        if sort == "oldest":
            query = query.order("created_at", desc=False)
        elif sort == "most_upvoted":
            query = query.order("upvote_count", desc=True)
        elif sort == "most_commented":
            query = query.order("comment_count", desc=True)
        else:
            query = query.order("created_at", desc=True)

        # execute query
        response = query.execute()

        # return data
        return {
            "data": response.data,
            "total": len(response.data),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch discussions: {e}",
        )


# Route to get discussion categories (must be before {discussion_id} route)
@router.get("/discussions/categories")
async def get_discussion_categories():
    """Get all active discussion categories"""
    try:
        response = (
            supabase.table("discussion_categories")
            .select("*")
            .eq("is_active", True)
            .order("sort_order", desc=False)
            .execute()
        )
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {e}")


# Route to get a specific discussion by ID
@router.get("/discussions/{discussion_id}")
async def get_discussion_by_id(discussion_id: str):
    """
    This function returns a specific discussion by its ID
    """
    try:
        # Get the discussion by id from the database
        response = (
            supabase.table("discussions")
            .select("*")
            .eq("id", discussion_id)
            .single()
            .execute()
        )

        # Check if discussion exists
        if not response.data:
            raise HTTPException(
                status_code=404, detail=f"Discussion with id {discussion_id} not found"
            )

        return response.data

    except Exception as e:
        # Handle supabase errors
        if hasattr(e, "code") and e.code == "PGRST116":
            raise HTTPException(
                status_code=404, detail=f"Discussion with id {discussion_id} not found"
            )
        raise HTTPException(
            status_code=500, detail=f"Error fetching discussion: {str(e)}"
        )


# Route to get comments for a specific discussion
@router.get("/discussions/{discussion_id}/comments")
async def get_discussion_comments(discussion_id: str):
    """
    This function returns all comments for a specific discussion
    """
    try:
        # Get all comments for the discussion
        response = (
            supabase.table("discussions_comments")
            .select("*")
            .eq("discussion_id", discussion_id)
            .order("created_at", desc=False)  # Oldest first
            .execute()
        )

        return {"data": response.data, "total": len(response.data)}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching comments: {str(e)}"
        )


# Protected route for making new discussions
@router.post("/discussion")
async def post_new_discussion(
    # get the form info from frontend (Anime data added in as well for anime table)
    anime_id: int = Form(...),
    category_id: str = Form(...),
    title: str = Form(...),
    body: str = Form(...),
    is_spoiler: bool = Form(...),
    is_locked: bool = Form(...),
    title_romaji: str | None = Form(None),
    title_english: str | None = Form(None),
    cover_image_url: str | None = Form(None),
    status: str | None = Form(None),
    season: str | None = Form(None),
    season_year: int | None = Form(None),
    thumbnail: UploadFile | None = File(None),  # optional params
    episode_number: int | None = Form(None),  # optional params
    season_number: int | None = Form(None),  # optional params
    authorization: str = Header(...) # required
):

    # check if the request has an authorized user handles errors
    user: User  = auth_validator(authorization)

    # account for negative anime
    if anime_id <= 0:
        raise HTTPException(status_code=422, detail="anime_id must be a positive integer")

    # validate the anime with anilist
    anime_exists = await validate_anime_exists(anime_id)
    if not anime_exists:
        raise HTTPException(
            status_code=422,
            detail="anime_id does not map to a valid AniList anime",
        )

    # format the anime_payload to send to anime table
    anime_payload = {
        "id": anime_id,
        "title_romaji": normalize_optional_text(title_romaji),
        "title_english": normalize_optional_text(title_english),
        "cover_image_url": normalize_optional_text(cover_image_url),
        "status": normalize_optional_text(status),
        "season": normalize_optional_text(season),
        "season_year": season_year,
    }

    try:
        # insert in to anime table so we can store the anime if it's new
        supabase.table("anime").upsert(anime_payload, on_conflict="id").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anime upsert failed: {e}")
    
    # variables to hold the thumbnail info
    thumbnail_path = None
    thumbnail_public_url = None

    # check if there is a thumbnail in the request
    if thumbnail is not None:
        # allowed types for the file sent (might not need)
        allowed = {"image/jpeg", "image/png", "image/webp"}
        # check to see if the file type is allowed
        if thumbnail.content_type not in allowed:
            raise HTTPException(
                status_code=415, detail="Thumnail must be a png, jpeg or webp file"
            )
        # otherwise store the thumbnail
        file_bytes = await thumbnail.read()

        # make the max bytes 5mb to help with storage (might make bigger)
        max_bytes = 5 * 1024 * 1024
        
        # make sure the file size is not bigger than the allowed
        if len(file_bytes) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail="Thumbnail is too large to be uploaded (max: 5mb)",
            )
        # get the file type from the name
        ext = ext_from_filename(thumbnail.filename or "")

        if not ext:
            # make which ever one matches the content type
            ext = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
            }[thumbnail.content_type]

        # create uniqe file path to send to the bucket
        thumbnail_path = f"threads/{uuid.uuid4().hex}{ext}"

        try:
            # upload the thumbnail to the storage bucket
            supabase.storage.from_(storage_key_discussion).upload(
                path=thumbnail_path,  # custom file path
                file=file_bytes,  # file bytes that get stored up
                file_options={"content-type": thumbnail.content_type, "upsert": False},
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload of file failed: {e}")

        try:
            # try to get the public url to send to database to help link database to bucket
            thumbnail_public_url = supabase.storage.from_(
                storage_key_discussion
            ).get_public_url(thumbnail_path)
        except Exception:
            # if not store none seeing as there must be no thumbnail posted
            thumbnail_public_url = None

    # Payload that i'll send to the discussions table 
    payload = {
        "anime_id": anime_id,
        "category_id": category_id,
        "created_by": user.id,
        "title": title.strip(),  # get rid of extra spaces (might change)
        "body": body.strip(),
        "episode_number": episode_number,
        "season_number": season_number,
        "is_spoiler": is_spoiler,
        "is_locked": is_locked,
        "thumbnail_path": thumbnail_path,
        "thumbnail_url": thumbnail_public_url,
    }

    # try to send the needed data to the database
    try:
        # add the data from the request to the database
        res = supabase.table("discussions").insert(payload).execute()
    except Exception as e:
        # if there is a path for the thumbnail
        if thumbnail_path:
            try:
                # remove the file if it fails to add to the database
                supabase.storage.from_(storage_key_discussion).remove([thumbnail_path])
            except Exception:
                # doesn't matter
                pass
        # return a regular failed message
        raise HTTPException(status_code=500, detail=f"DB insert failed: {e}")

    # store the data to return to validate success
    success = (res.data or None)[0]

    # return the data
    return {"discussion": success}


# Route to get the upvote status for a specific discussion for the current user
@router.get("/discussions/{discussion_id}/upvote")
async def get_upvote_status(discussion_id: str, authorization: str = Header(...)):
    """
    Returns whether the current user has upvoted a discussion.
    """
    user: User = auth_validator(authorization)

    try:
        response = (
            supabase.table("discussion_upvotes")
            .select("*")
            .eq("discussion_id", discussion_id)
            .eq("user_id", str(user.id))
            .execute()
        )
        return {"upvoted": len(response.data) > 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch upvote status: {e}")


# Route to toggle an upvote on a discussion
@router.post("/discussions/{discussion_id}/upvote")
async def toggle_upvote(discussion_id: str, authorization: str = Header(...)):
    """
    Toggles an upvote on a discussion for the current user.
    Returns the new upvote state and updated count.
    """
    user: User = auth_validator(authorization)

    try:
        result = supabase.rpc(
            "toggle_discussion_upvote",
            {"p_discussion_id": discussion_id, "p_user_id": str(user.id)},
        ).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle upvote: {e}")


# Route to submit a comment on a discussion
@router.post("/discussions/{discussion_id}/comments")
async def post_comment(
    discussion_id: str,
    comment: CommentRequest = Body(...),
    authorization: str = Header(...),
):
    """Submit a comment on a discussion"""
    user: User = auth_validator(authorization)

    # validate body is not empty
    body = comment.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Comment body cannot be empty")

    # get username and avatar from user metadata
    metadata = user.user_metadata or {}
    username = metadata.get("username", "Anonymous")
    avatar_url = metadata.get("avatar_url")

    payload = {
        "discussion_id": discussion_id,
        "created_by": str(user.id),
        "created_by_username": username,
        "created_by_avatar_url": avatar_url,
        "body": body,
        "is_spoiler": comment.is_spoiler,
    }

    # add parent comment if it's a reply
    if comment.parent_comment_id:
        payload["parent_comment_id"] = comment.parent_comment_id

    try:
        res = supabase.table("discussions_comments").insert(payload).execute()
    except Exception as e:
        print(f"[COMMENT INSERT ERROR] {e}")  # TODO: remove after debugging
        raise HTTPException(status_code=500, detail=f"Failed to insert comment: {e}")

    try:
        # increment comment count on the discussion
        discussion = (
            supabase.table("discussions")
            .select("comment_count")
            .eq("id", discussion_id)
            .single()
            .execute()
        )
        new_count = (discussion.data.get("comment_count", 0)) + 1
        supabase.table("discussions").update(
            {"comment_count": new_count}
        ).eq("id", discussion_id).execute()
    except Exception:
        # comment was already saved, don't fail the whole request
        pass

    return {"comment": res.data[0]}


# Route to get comment upvote status for the current user
@router.get("/comments/{comment_id}/upvote")
async def get_comment_upvote_status(comment_id: str, authorization: str = Header(...)):
    """Returns whether the current user has upvoted a comment."""
    user: User = auth_validator(authorization)

    try:
        response = (
            supabase.table("comment_upvotes")
            .select("*")
            .eq("comment_id", comment_id)
            .eq("user_id", str(user.id))
            .execute()
        )
        return {"upvoted": len(response.data) > 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch comment upvote status: {e}")


# Route to toggle an upvote on a comment
@router.post("/comments/{comment_id}/upvote")
async def toggle_comment_upvote(comment_id: str, authorization: str = Header(...)):
    """Toggles an upvote on a comment for the current user."""
    user: User = auth_validator(authorization)

    try:
        result = supabase.rpc(
            "toggle_comment_upvote",
            {"p_comment_id": comment_id, "p_user_id": str(user.id)},
        ).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle comment upvote: {e}")


# Route to update a discussion (only by the author)
@router.patch("/discussions/{discussion_id}")
async def update_discussion(
    discussion_id: str,
    updates: DiscussionUpdateRequest = Body(...),
    authorization: str = Header(...),
):
    """Update a discussion (only by author)"""
    user: User = auth_validator(authorization)

    try:
        # check that this user owns the discussion
        discussion = (
            supabase.table("discussions")
            .select("created_by")
            .eq("id", discussion_id)
            .single()
            .execute()
        )

        if not discussion.data:
            raise HTTPException(status_code=404, detail="Discussion not found")

        if discussion.data["created_by"] != str(user.id):
            raise HTTPException(status_code=403, detail="You can only edit your own discussions")

        # build update payload with only provided fields
        payload = {}
        if updates.title is not None:
            payload["title"] = updates.title.strip()
        if updates.body is not None:
            payload["body"] = updates.body.strip()
        if updates.is_spoiler is not None:
            payload["is_spoiler"] = updates.is_spoiler
        if updates.is_locked is not None:
            payload["is_locked"] = updates.is_locked

        if not payload:
            raise HTTPException(status_code=422, detail="No fields to update")

        res = (
            supabase.table("discussions")
            .update(payload)
            .eq("id", discussion_id)
            .execute()
        )

        return {"discussion": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update discussion: {e}")


# Route to delete a discussion (only by the author)
@router.delete("/discussions/{discussion_id}")
async def delete_discussion(
    discussion_id: str,
    authorization: str = Header(...),
):
    """Delete a discussion (only by author)"""
    user: User = auth_validator(authorization)

    try:
        # check that this user owns the discussion
        discussion = (
            supabase.table("discussions")
            .select("created_by, thumbnail_path")
            .eq("id", discussion_id)
            .single()
            .execute()
        )

        if not discussion.data:
            raise HTTPException(status_code=404, detail="Discussion not found")

        if discussion.data["created_by"] != str(user.id):
            raise HTTPException(status_code=403, detail="You can only delete your own discussions")

        # delete comments first
        supabase.table("discussions_comments").delete().eq(
            "discussion_id", discussion_id
        ).execute()

        # delete upvotes
        supabase.table("discussion_upvotes").delete().eq(
            "discussion_id", discussion_id
        ).execute()

        # delete the discussion
        supabase.table("discussions").delete().eq("id", discussion_id).execute()

        # clean up thumbnail from storage if exists
        thumbnail_path = discussion.data.get("thumbnail_path")
        if thumbnail_path:
            try:
                supabase.storage.from_(storage_key_discussion).remove([thumbnail_path])
            except Exception:
                pass

        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete discussion: {e}")



# AniLoaded Codebase Map

> **Read this file first** when returning to the project. It is meant to give both humans and agents a fast mental model of how the app is organized, where features live, and which files matter most.

## 1) What this project is

AniLoaded is a full-stack anime app with 2 main parts:

- **Frontend**: React + Vite + TypeScript
- **Backend**: FastAPI + Supabase + AniList integration

Main product areas currently in the codebase:

- Anime browsing and detail pages
- Community discussions + comments + upvotes
- User-created ranked anime lists
- User watchlist management
- AI-powered recommendation chat backed by embeddings/RAG + an LLM
- Supabase auth/profile management

---

## 2) High-level architecture

### System shape

```text
Frontend (React)
  -> calls Backend (FastAPI)
       -> calls AniList for anime data
       -> calls Supabase for app data/auth/storage
       -> calls OpenAI + vector search for recommendations
```

### Data ownership

- **AniList** = source of anime metadata
- **Supabase** = source of user/app data
  - auth
  - profiles
  - discussions
  - comments
  - lists
  - watchlist
  - chat sessions/messages
  - storage bucket for discussion thumbnails
- **OpenAI + Supabase vector search** = recommendation/search pipeline

### Important split

- The **frontend** is mostly UI, routing, forms, query caching, and auth session usage.
- The **backend** is where external APIs, validation, authorization, database writes, and recommendation orchestration live.

---

## 3) Repo layout

```text
App/
  frontend/   React app
  backend/    FastAPI app
  docker-compose.yml
  AGENTS.md
  CODEBASE_MAP.md   <- this file
```

---

## 4) Frontend architecture

## 4.1 Frontend entry + app shell

| File | Purpose |
|---|---|
| `frontend/src/main.tsx` | React bootstrap; mounts app and React Query provider. |
| `frontend/src/App.tsx` | Main route map for the whole frontend. Best frontend file to read first. |
| `frontend/src/layouts/RootLayout.tsx` | App shell for normal pages; renders navbar, footer, outlet, recommendation sidebar state. |
| `frontend/src/layouts/AuthLayout.tsx` | Wrapper layout for login/signup routes. |
| `frontend/src/index.css` / `frontend/src/App.css` | Global styling. |

### Route map from `frontend/src/App.tsx`

| Route | Page | Purpose |
|---|---|---|
| `/` | `pages/HomePage.tsx` | Landing page with carousel + trending/popular/top anime sections. |
| `/anime` | `pages/AnimeCategoriesPage.tsx` | Genre/season/search-based anime browsing with pagination. |
| `/anime/:id` | `pages/AnimeInfoPage.tsx` | Detailed anime page with banner, plot, characters, related featured anime, watchlist toggle. |
| `/discussions` | `pages/DiscussionPage.tsx` | Discussion index with search/filter/sort. |
| `/discussion/:id` | `pages/DiscussionInfoPage.tsx` | Single discussion page with comments, edit/delete, upvote, replies. |
| `/discussion/submit` | `pages/DiscussionSubmitPage.tsx` | Create new discussion form. |
| `/lists` | `pages/ListsPage.tsx` | Public anime lists page. |
| `/list/create` | `pages/ListSubmitPage.tsx` | Create ranked user list. |
| `/list/:id` | `pages/ListInfoPage.tsx` | View/edit/delete a specific list. |
| `/recommendations` | `pages/RecommendationsPage.tsx` | AI recommendation chat UI with conversation history. |
| `/profile` | `pages/UserProfilePage.tsx` | Account/profile/watchlist/settings page. |
| `/auth/login` | `pages/LoginPage.tsx` | Login page. |
| `/auth/signup` | `pages/SignUpPage.tsx` | Signup page. |

---

## 4.2 Frontend page responsibilities

### Core browsing pages

| File | What it does |
|---|---|
| `frontend/src/pages/HomePage.tsx` | Uses loader-prefetched anime data and React Query to render homepage sections; also loads Supabase-hosted ads and a mock review section. |
| `frontend/src/pages/AnimeCategoriesPage.tsx` | Reads URL search params, fetches available genres/seasons, requests filtered anime from backend, and handles pagination. |
| `frontend/src/pages/AnimeInfoPage.tsx` | Loads one anime by AniList ID, renders banner/details/characters, sanitizes AniList HTML description, and hooks into watchlist toggling. |

### Discussions pages

| File | What it does |
|---|---|
| `frontend/src/pages/DiscussionPage.tsx` | Fetches all discussions and category filters; supports search, category filter, and sort options. |
| `frontend/src/pages/DiscussionInfoPage.tsx` | Shows one discussion, threaded comments, comment form, upvote button, and author-only edit/delete controls. |
| `frontend/src/pages/DiscussionSubmitPage.tsx` | TanStack Form + Zod discussion creation flow; supports anime search, optional thumbnail upload, spoiler/lock toggles. |

### Lists pages

| File | What it does |
|---|---|
| `frontend/src/pages/ListsPage.tsx` | Fetches and renders public lists. |
| `frontend/src/pages/ListSubmitPage.tsx` | Create-list experience with drag-reorderable anime ranking, title/genre/visibility/description, and submission validation. |
| `frontend/src/pages/ListInfoPage.tsx` | View a specific list; if owner, can edit title/description/entries, reorder entries, add/remove entries, or delete list. |

### Account + auth + AI pages

| File | What it does |
|---|---|
| `frontend/src/pages/RecommendationsPage.tsx` | Main recommendation-chat UI: conversation list, active chat thread, create new chat, send message, auth gate. |
| `frontend/src/pages/UserProfilePage.tsx` | Large profile page for account info, avatar/username/password management, and watchlist viewing/filtering. |
| `frontend/src/pages/LoginPage.tsx` | Logs in with Supabase password auth. |
| `frontend/src/pages/SignUpPage.tsx` | Signs up with Supabase auth and shows email verification modal. |

---

## 4.3 Frontend components by feature

### Shared layout/UI

| File | What it does |
|---|---|
| `frontend/src/components/Navbar.tsx` | Top navigation; also controls recommendation sidebar toggle when on recommendation route. |
| `frontend/src/components/Footer.tsx` | Site footer. |
| `frontend/src/components/LoadingSpinner.tsx` | Shared spinner UI. |
| `frontend/src/components/ErrorBoundary.tsx` | Route error fallback. |
| `frontend/src/components/ApiServiceError.tsx` | Standard API failure message + retry action UI. |
| `frontend/src/components/CreateButton.tsx` | Reusable “Create” link button. |

### Anime browsing/display

| File | What it does |
|---|---|
| `frontend/src/components/Carousel.tsx` | Homepage hero carousel. |
| `frontend/src/components/CardCarousel.tsx` | Card-based horizontal carousel wrapper. |
| `frontend/src/components/ShowcaseSection.tsx` | Renders a titled section of anime cards. |
| `frontend/src/components/AnimeCard.tsx` | Reusable anime poster card with hover details and watchlist toggle. |
| `frontend/src/components/AnimeBanner.tsx` | Large banner/header UI for anime detail page. |
| `frontend/src/components/CategoryFilters.tsx` | Genre/season filter controls for category page. |
| `frontend/src/components/SearchBar.tsx` | Anime suggestion search UI. |
| `frontend/src/components/TopAnimeShowcase.tsx` | Showcase variant for top anime. |
| `frontend/src/components/skeleton/AnimeCardSkeleton.tsx` | Loading placeholder for anime grid. |
| `frontend/src/components/skeleton/AnimeBannerSkeleton.tsx` | Loading placeholder for anime detail banner. |

### Discussions

| File | What it does |
|---|---|
| `frontend/src/components/DiscussionCard.tsx` | Summary card for discussion listing. |
| `frontend/src/components/CommentForm.tsx` | Comment/reply form. |
| `frontend/src/components/CommentThread.tsx` | Recursive/threaded comment renderer. |
| `frontend/src/components/UpvoteButton.tsx` | Upvote button/state for discussions/comments. |

### Lists

| File | What it does |
|---|---|
| `frontend/src/components/UserEntryShowcase.tsx` | Main visual component for a user list; supports read-only and editable modes. |
| `frontend/src/components/forms/ListAnimeCard.tsx` | Single ranked anime card in list creation/edit flows. |
| `frontend/src/components/forms/ListAnimeSearchModal.tsx` | Search modal to add anime into a list. |
| `frontend/src/components/forms/ListTitleInput.tsx` | Styled title input for list creation. |

### Discussion form sections

These break the large discussion form into focused pieces:

- `components/forms/DiscussionAnimeSearchSection.tsx` – select AniList anime
- `components/forms/DiscussionBodySection.tsx` – body field
- `components/forms/DiscussionCategorySection.tsx` – category picker
- `components/forms/DiscussionEpisodeNumberSection.tsx` – optional episode number
- `components/forms/DiscussionSeasonNumberSection.tsx` – optional season number
- `components/forms/DiscussionThumbnailSection.tsx` – thumbnail upload + validation
- `components/forms/DiscussionTitleSection.tsx` – title field
- `components/forms/DiscussionToggleSection.tsx` – spoiler/locked toggles
- `components/forms/getFieldErrorMessage.ts` – field error helper

### Recommendation UI

| File | What it does |
|---|---|
| `frontend/src/components/RecommendationInput.tsx` | Chat input for recommendation page. |

### Misc/demo UI

| File | What it does |
|---|---|
| `frontend/src/components/ReviewCard.tsx` / `ReviewList.tsx` | Placeholder/mock review content. |

---

## 4.4 Frontend services and data layer

### API clients

| File | What it does |
|---|---|
| `frontend/src/services/api/fetchAnimes.ts` | Core anime endpoints: trending, popular, top, anime by ID. |
| `frontend/src/services/api/animeCategoriesService.ts` | Category page endpoints: genre list, season list, filtered anime search. |
| `frontend/src/services/api/discussionService.ts` | Discussions CRUD, comments, categories, discussion/comment upvotes. |
| `frontend/src/services/api/userListsService.ts` | Public list fetch, specific list fetch, create/update/delete list. |
| `frontend/src/services/api/userWatchlistService.ts` | Watchlist CRUD and status checks. |
| `frontend/src/services/api/recommendationService.ts` | Recommendation conversation fetch/create/message send. |

### Important frontend behavior hooks

| File | What it does |
|---|---|
| `frontend/src/hooks/useWatchlistToggle.ts` | Optimistic watchlist add/remove toggle used by anime cards/banner. |
| `frontend/src/hooks/RandomHook.ts` | Misc hook file; not central to current architecture. |

### Loaders / prefetchers

| File | What it does |
|---|---|
| `frontend/src/services/loaders/homePageLoader.ts` | Prefetches homepage anime queries + carousel/ad assets. |
| `frontend/src/services/loaders/animeInfoPrefetcher.ts` | Prefetches anime detail query before route render. |
| `frontend/src/services/loaders/discussionPageLoader.ts` | Discussion page route loader helper. |
| `frontend/src/services/loaders/discussionInfoPrefetcher.ts` | Prefetches discussion detail page data. |
| `frontend/src/services/loaders/animeCategoriesLoader.ts` | Prefetches category page data. |
| `frontend/src/services/loaders/listsPageLoader.ts` | Intended list page prefetch helper. |
| `frontend/src/services/loaders/carouselLoader.ts` | Carousel-specific prefetch logic. |

### Query client

| File | What it does |
|---|---|
| `frontend/src/services/clients/queryClient.ts` | Primary TanStack Query client config actually used by app routes. |
| `frontend/src/lib/queryClient.ts` | Extra query client file; likely older/duplicate utility. |

---

## 4.5 Frontend auth + Supabase

| File | What it does |
|---|---|
| `frontend/src/services/supabase/supabaseConnection.ts` | Creates Supabase browser client using env vars. |
| `frontend/src/services/supabase/supabaseAuth.ts` | Signup/signout/get current user/update password/update metadata helpers. |
| `frontend/src/services/supabase/hooks/useAuth.ts` | Central auth-session sync hook using `onAuthStateChange`. |
| `frontend/src/services/supabase/hooks/AuthProvider.tsx` | Context provider exposing shared user/loading/refreshUser state. |
| `frontend/src/services/supabase/hooks/useAuth.ts` | Best place to understand frontend auth lifecycle. |
| `frontend/src/services/supabase/getMainPagePhotos.ts` | Reads homepage carousel/ads assets from Supabase storage/buckets. |

---

## 4.6 Frontend schemas/types

### Core app types

| File | Purpose |
|---|---|
| `frontend/src/schemas/animeSchemas.ts` | Main AniList media interfaces used across the app. |
| `frontend/src/schemas/discussion.ts` | Discussion, comments, category, request/response types. |
| `frontend/src/schemas/recommendations.ts` | Recommendation-related interfaces. |
| `frontend/src/schemas/genres.ts` / `seasons.ts` | Simple response shapes. |
| `frontend/src/schemas/adSchema.ts` / `CarouselSchema.ts` | Homepage asset typing. |
| `frontend/src/schemas/user.ts` | User-related typings. |

### Zod validation schemas

| File | Purpose |
|---|---|
| `frontend/src/schemas/zod/discussionFormSchema.ts` | Discussion form validation. |
| `frontend/src/schemas/zod/listFormSchema.ts` | User list creation/update validation and response interfaces. |
| `frontend/src/schemas/zod/userWatchlistSchema.ts` | Watchlist request/response validation. |
| `frontend/src/schemas/zod/chatSchema.ts` | Recommendation chat schemas. |

### Utilities

| File | Purpose |
|---|---|
| `frontend/src/utilities/htmlUtils.ts` | Sanitizes AniList HTML descriptions before rendering. |
| `frontend/src/utilities/util.ts` | Misc utilities. |
| `frontend/src/services/animeInfoPageFunctionality.ts` | Extra anime-page helper file. |

---

## 5) Backend architecture

## 5.1 Backend entrypoint

| File | Purpose |
|---|---|
| `backend/main.py` | FastAPI app setup, dotenv load, request logging middleware, CORS, router registration. |

### Routers registered in `backend/main.py`

- `routers.health`
- `routers.anime`
- `routers.discussions`
- `routers.lists`
- `routers.recommendations`

### Important backend behavior in `main.py`

- Loads `.env` before imports that depend on env vars
- Adds structured request logging with request IDs
- Adds CORS for `http://localhost:5173`

---

## 5.2 Backend routers

## `backend/routers/health.py`

| Endpoint | Purpose |
|---|---|
| `GET /` | Simple backend health/test message. |

## `backend/routers/anime.py`

**Role:** AniList proxy layer with in-memory caching and upstream error normalization.

### Main helpers

| Function | Purpose |
|---|---|
| `_raise_anilist_service_error` | Standardized HTTPException raising for AniList failures. |
| `_has_forbidden_graphql_error` | Detects access/forbidden GraphQL errors from AniList payloads. |
| `_extract_graphql_errors` | Pulls GraphQL errors out of AniList response payloads. |
| `_post_to_anilist` | Shared HTTP POST to AniList with robust upstream error handling. |
| `build_cache_key` | Creates deterministic cache keys. |

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /anime/genres` | Cached AniList genres list. |
| `GET /anime/seasons` | Cached seasons list. |
| `GET /anime/categories` | Filtered/paginated anime query by genre/season/search. |
| `GET /anime/popular` | Popular anime showcase feed. |
| `GET /anime/trending` | Trending anime showcase feed. |
| `GET /anime/top` | Top-rated anime showcase feed. |
| `GET /anime/{anime_id}` | Full anime detail payload for detail page. |

## `backend/routers/discussions.py`

**Role:** Discussion forum backend.

### Main helpers

| Function | Purpose |
|---|---|
| `normalize_optional_text` | Trims empty strings to `None`. |
| `_call_maybe_async` | Supports sync/async Supabase storage methods uniformly. |
| `validate_anime_exists` | Verifies AniList anime ID before discussion/list creation. |

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /discussions` | Fetch discussions with search/filter/sort. |
| `GET /discussions/categories` | Fetch active discussion categories from Supabase. |
| `GET /discussions/{discussion_id}` | Fetch one discussion. |
| `GET /discussions/{discussion_id}/comments` | Fetch comments for discussion. |
| `POST /discussion` | Create new discussion, optionally upload thumbnail, and upsert referenced anime row. |
| `GET /discussions/{discussion_id}/upvote` | Current user's discussion upvote status. |
| `POST /discussions/{discussion_id}/upvote` | Toggle discussion upvote via Supabase RPC. |
| `POST /discussions/{discussion_id}/comments` | Create new comment/reply. |
| `GET /comments/{comment_id}/upvote` | Current user's comment upvote status. |
| `POST /comments/{comment_id}/upvote` | Toggle comment upvote via Supabase RPC. |
| `PATCH /discussions/{discussion_id}` | Author-only discussion edit. |
| `DELETE /discussions/{discussion_id}` | Author-only discussion delete + cleanup comments/upvotes/thumbnail. |

## `backend/routers/lists.py`

**Role:** User lists + watchlist backend.

### Main helpers

| Function | Purpose |
|---|---|
| `attach_anime_to_list_entries` | Hydrates list entries with AniList media data. |
| `normalize_owner_username` | Resolves `owner_id` to username from `profiles` table. |

### List endpoints

| Endpoint | Purpose |
|---|---|
| `GET /lists` | Public lists with hydrated anime data. |
| `GET /list/{list_id}` | Specific list; allows private list access only to owner. |
| `PATCH /list/{list_id}` | Owner updates list metadata + entries via Supabase RPC. |
| `DELETE /list/{list_id}` | Owner deletes list. |
| `POST /create-list` | Create new list and insert ranked entries. |

### Watchlist endpoints

| Endpoint | Purpose |
|---|---|
| `GET /watchlist` | Current user's watchlist. |
| `GET /watchlist/{watched_id}` | Check if anime exists in current user's watchlist. |
| `POST /watchlist/{watched_id}` | Add anime to watchlist. |
| `PATCH /watchlist/{watched_id}` | Update watchlist status. |
| `DELETE /watchlist/{watched_id}` | Remove from watchlist. |
| `GET /watchlist/status/{anime_id}` | Get simple watchlist state/status for one anime. |
| `GET /users/{user_id}/watchlist` | Public/user-specific watchlist fetch by user ID. |

### Incomplete/stubbed routes in `lists.py`

| Function/Endpoint | Status |
|---|---|
| `get_users_lists` | Stubbed with `pass` |
| `get_popular_lists` | Stubbed with `pass` |

## `backend/routers/recommendations.py`

**Role:** Recommendation conversation backend + AI pipeline orchestration.

### Main helpers

| Function | Purpose |
|---|---|
| `_generate_conversation_title` | Auto-title from first user message. |
| `_preview_content` | Short logging preview of user message. |
| `_get_session_for_user` | Ensures session exists and belongs to authenticated user. |
| `_get_session_messages` | Loads chat history from Supabase. |
| `_get_session_with_messages` | Combines session metadata + messages for response. |

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /recommendations/conversations` | List current user's chat sessions. |
| `POST /recommendations/conversations` | Create empty chat session. |
| `GET /recommendations/conversations/{session_id}` | Load one conversation with message history. |
| `POST /recommendations/conversations/{session_id}/messages` | Save user message, run filtering + agent, save assistant reply, return updated conversation. |

---

## 5.3 Backend AI / recommendation pipeline

### Main files

| File | Purpose |
|---|---|
| `backend/agents/recommendation_agent.py` | LangChain agent setup using `ChatOpenAI`; builds final recommendation response. |
| `backend/agents/tools.py` | Agent tools wrapping RAG functions (`search_similar_anime`, watchlist tools). |
| `backend/rag/rag_service.py` | Embedding search, vector match RPC usage, completed-watchlist filtering, recommendation candidate prep. |
| `backend/schemas/chat.py` | Pydantic chat session/message schemas. |
| `backend/schemas/recommendations.py` | Recommendation result schema used by RAG/agent layers. |

### Recommendation flow

```text
Frontend recommendation page
  -> POST /recommendations/conversations/{id}/messages
    -> save user message in Supabase
    -> load recent messages
    -> vector search for similar anime
    -> load user's completed watchlist
    -> filter out completed anime
    -> run LangChain/OpenAI agent on filtered candidates + chat history
    -> save assistant message
    -> return updated conversation
```

### Important behavior

- Retrieval is not fully free-form; the backend first narrows anime candidates.
- The LLM mainly formats/selects from filtered results.
- Recommendation history is persisted in Supabase (`chat_sessions`, `chat_messages`).

---

## 5.4 Backend database/auth/utilities

| File | What it does |
|---|---|
| `backend/database/supabase_client.py` | Creates shared or per-request authenticated Supabase clients. |
| `backend/utilities/auth_validator.py` | Validates `Bearer` token against Supabase auth. |
| `backend/utilities/cache.py` | Simple in-memory TTL cache used by anime endpoints. |
| `backend/utilities/anilist_client.py` | Batch AniList media fetch/hydration helper for list entries. |
| `backend/utilities/genreFunctions.py` | Fetches/caches genres. |
| `backend/utilities/seasonFunctions.py` | Supplies cached season list. |
| `backend/utilities/fileFunctions.py` | Filename/extension helpers used by file upload flow. |
| `backend/utilities/fileFunctions.py` | Important to thumbnail upload validation. |

### Operational/maintenance file

| File | Purpose |
|---|---|
| `backend/routers/anime_seeding_process.py` | Script-like router file for embedding/seed process; not part of normal frontend request flow. |

---

## 5.5 Backend schemas

| File | Purpose |
|---|---|
| `backend/schemas/anilist.py` | Pydantic models for AniList media/page response structures. |
| `backend/schemas/category_requests.py` | Query param schema for anime category filtering. |
| `backend/schemas/discussions.py` | Discussion/comment/category request/response models. |
| `backend/schemas/lists.py` | User list request/response/update models. |
| `backend/schemas/watchlist.py` | Watchlist request/response/status models. |
| `backend/schemas/chat.py` | Recommendation chat models. |
| `backend/schemas/recommendations.py` | Matched anime response model for recommendation engine. |
| `backend/schemas/anime-requests.py` | Extra schema file; name suggests older or alternate request models. |

---

## 6) Testing map

## Frontend tests

Mostly colocated/unit-style tests:

- `components/AnimeCard.test.tsx`
- `components/forms/getFieldErrorMessage.test.ts`
- `hooks/useWatchlistToggle.test.tsx`
- `pages/ListSubmitPage.test.tsx`
- `schemas/animeSchemas.test.ts`
- `schemas/zod/userWatchlistSchema.test.ts`
- `services/api/*.test.ts`
- `services/loaders/animeInfoPrefetcher.test.ts`
- `utilities/htmlUtils.test.ts`
- `test/setup.ts`

## Backend tests

### Integration

- `backend/tests/integration/test_anime_routes.py`
- `backend/tests/integration/test_discussion_routes.py`
- `backend/tests/integration/test_health_routes.py`
- `backend/tests/integration/test_lists_routes.py`
- `backend/tests/integration/test_recommendation_routes.py`

### Unit

- AniList helper behavior
- cache behavior
- auth validator
- genre/season/file helpers
- list hydration helpers
- discussion helpers

This means the backend has the stronger architecture/test backbone right now.

---

## 7) Runtime + environment summary

## Frontend

Key envs used:

- `VITE_BACKEND_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- homepage asset bucket/folder envs in `getMainPagePhotos.ts`

## Backend

Key envs used:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENAI_API_KEY`
- `STORAGE_KEY_DISCUSSION`
- `LOG_LEVEL`

## Docker

| File | Purpose |
|---|---|
| `docker-compose.yml` | Runs frontend on `5173` and backend on `8000` with live reload mounts. |
| `frontend/Dockerfile.dev` | Frontend dev container. |
| `backend/Dockerfile.dev` | Backend dev container. |

---

## 8) Important flows to understand first

## Flow A: Anime browse -> detail

1. Frontend route loads page
2. React Query calls frontend API service
3. Backend anime router proxies to AniList
4. Backend caches response
5. Frontend renders anime cards/detail page
6. User can toggle watchlist if authenticated

## Flow B: Create discussion

1. User fills multi-section TanStack form
2. Frontend builds `FormData`
3. Backend validates Supabase auth token
4. Backend validates anime exists on AniList
5. Backend optionally uploads thumbnail to Supabase storage
6. Backend inserts discussion row into Supabase

## Flow C: Create/edit list

1. Frontend manages ranked anime entries locally
2. User submits list JSON to backend
3. Backend validates auth + validates anime IDs via AniList
4. Backend inserts/upserts related anime/list/list entries in Supabase
5. On read, backend hydrates entry anime data from AniList batch fetch

## Flow D: Recommendation chat

1. Frontend opens/creates chat session
2. User sends message
3. Backend persists message
4. Backend vector-searches similar anime
5. Backend filters out completed watchlist items
6. Backend runs agent to write final recommendation response
7. Backend stores assistant response and returns updated thread

---

## 9) Known gaps / incomplete areas

These are useful to know before changing code:

- `backend/routers/lists.py`
  - `get_users_lists()` is not implemented
  - `get_popular_lists()` is not implemented
- `frontend/src/services/api/userListsService.ts`
  - `getUsersTopLists()` points to `/user-list`, which may not match backend route naming
- `frontend/src/services/api/fetchAnimes.ts`
  - `usersTopAnime()` is a stub
- `frontend/src/components/ReviewList.tsx` and related review UI appear to be placeholder/demo content
- Some duplicate/older helper files exist (`lib/queryClient.ts` vs `services/clients/queryClient.ts`)
- There are many TODO comments for polish, refactor, and stronger loading/error states

---

## 10) Suggested “read order” for fast context next time

If you come back later, read these in order:

1. `CODEBASE_MAP.md`
2. `frontend/src/App.tsx`
3. `backend/main.py`
4. `backend/routers/anime.py`
5. `backend/routers/discussions.py`
6. `backend/routers/lists.py`
7. `backend/routers/recommendations.py`
8. `frontend/src/pages/RecommendationsPage.tsx`
9. `frontend/src/pages/ListSubmitPage.tsx`
10. `frontend/src/pages/DiscussionSubmitPage.tsx`

That set gives a very fast overview of routing, data flow, major features, and where business logic lives.

---

## 11) Quick mental model by feature owner

### If you need to work on anime browsing
Start with:
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/AnimeCategoriesPage.tsx`
- `frontend/src/pages/AnimeInfoPage.tsx`
- `frontend/src/services/api/fetchAnimes.ts`
- `frontend/src/services/api/animeCategoriesService.ts`
- `backend/routers/anime.py`

### If you need to work on discussions
Start with:
- `frontend/src/pages/DiscussionPage.tsx`
- `frontend/src/pages/DiscussionInfoPage.tsx`
- `frontend/src/pages/DiscussionSubmitPage.tsx`
- `frontend/src/services/api/discussionService.ts`
- `backend/routers/discussions.py`

### If you need to work on lists/watchlist
Start with:
- `frontend/src/pages/ListsPage.tsx`
- `frontend/src/pages/ListSubmitPage.tsx`
- `frontend/src/pages/ListInfoPage.tsx`
- `frontend/src/hooks/useWatchlistToggle.ts`
- `frontend/src/services/api/userListsService.ts`
- `frontend/src/services/api/userWatchlistService.ts`
- `backend/routers/lists.py`

### If you need to work on auth/profile
Start with:
- `frontend/src/services/supabase/hooks/AuthProvider.tsx`
- `frontend/src/services/supabase/hooks/useAuth.ts`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/SignUpPage.tsx`
- `frontend/src/pages/UserProfilePage.tsx`
- `backend/utilities/auth_validator.py`

### If you need to work on AI recommendations
Start with:
- `frontend/src/pages/RecommendationsPage.tsx`
- `frontend/src/services/api/recommendationService.ts`
- `backend/routers/recommendations.py`
- `backend/rag/rag_service.py`
- `backend/agents/recommendation_agent.py`
- `backend/agents/tools.py`

---

## 12) Bottom line summary

This codebase is organized around **feature flows**, not just by layer:

- **Anime** = AniList-backed browsing
- **Discussions** = Supabase-backed community forum
- **Lists/Watchlist** = personal anime organization features
- **Recommendations** = chat + retrieval + LLM pipeline
- **Auth/Profile** = Supabase user/session management

If you want the fastest understanding, think of the app as:

**React UI + React Query on the front, FastAPI orchestration in the middle, Supabase/AniList/OpenAI as the data and intelligence backends.**

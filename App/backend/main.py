import json
import logging
import os
import time
import uuid

from dotenv import load_dotenv

# load env before importing modules that read environment variables at import time
load_dotenv()

# ignore the linting error you may see for these, (figure out later)
# better to avoid error with env before the run
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers.lists import router as list_router
from routers.anime import router as anime_router
from routers.discussions import router as discussions_router
from routers.health import router as health_router
from routers.recommendations import router as recommendations_router


class ContextFormatter(logging.Formatter):
    _base_keys = {
        "args",
        "asctime",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "module",
        "msecs",
        "message",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "thread",
        "threadName",
        "taskName",
    }

    def format(self, record: logging.LogRecord) -> str:
        base_message = super().format(record)
        context = {
            key: value
            for key, value in record.__dict__.items()
            if key not in self._base_keys and not key.startswith("_")
        }
        if not context:
            return base_message
        return f"{base_message} | context={json.dumps(context, default=str)}"


handler = logging.StreamHandler()
handler.setFormatter(
    ContextFormatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
)

root_logger = logging.getLogger()
root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
root_logger.handlers.clear()
root_logger.addHandler(handler)

logger = logging.getLogger(__name__)

logger.info("Starting AniLoaded backend")

# create the app object
app = FastAPI()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()

    logger.info(
        "Request started",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
        },
    )

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "Request failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
            },
        )
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Request-ID"] = request_id

    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )

    return response


# add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,  # this is the middleware
    allow_origins=[
        "http://localhost:5173"
        # "*"
    ],  # allow all origins (change to site url later on in prod)
    allow_credentials=False,  # allow credentials
    allow_methods=["*"],  # means allow all methods
    allow_headers=["*"],  # allow all headers
)

# routes
app.include_router(health_router)  # app health
app.include_router(anime_router)  # all the anime routes that call anilist
app.include_router(discussions_router)  # routes for the anime
app.include_router(list_router)
app.include_router(recommendations_router)  # recommendation agent routes

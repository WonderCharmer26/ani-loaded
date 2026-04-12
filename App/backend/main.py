import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.lists import router as list_router
from routers.anime import router as anime_router
from routers.discussions import router as discussions_router
from routers.health import router as health_router

# load in env
load_dotenv()

# create the app object
app = FastAPI()

# CORS origins: read from CORS_ORIGINS env var (comma-separated) or default to localhost
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,  # this is the middleware
    allow_origins=cors_origins,
    allow_credentials=False,  # allow credentials
    allow_methods=["*"],  # means allow all methods
    allow_headers=["*"],  # allow all headers
)

# routes
app.include_router(health_router)  # app health
app.include_router(anime_router)  # all the anime routes that call anilist
app.include_router(discussions_router)  # routes for the anime
app.include_router(list_router)

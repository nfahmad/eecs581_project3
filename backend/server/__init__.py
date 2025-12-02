"""
Program: EECS 581 Project 3 - Live Chat Application
File: __init__.py (FastAPI Application Factory)
Description:
    Defines and configures the main FastAPI application instance for the
    backend service. This includes:
      - Application lifespan management (startup logic).
      - Database initialization.
      - CORS configuration for the frontend.
      - Inclusion of all API routers (WebSocket, User, Room, Login).

Inputs:
    - Incoming HTTP and WebSocket requests from the frontend.
    - Environment where the app is deployed (local dev, etc.).

Outputs:
    - A fully configured FastAPI application object ready to be served by
      an ASGI server (e.g., Uvicorn).

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI documentation
    - CORSMiddleware documentation
    - EECS 581 course materials
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.database import init_db
from server.websocket.routes import router as ws_router
from server.user.routes import router as user_router
from server.room.routes import router as room_router
from server.login.routes import router as login_router


# Lifespan context manager:
# Code in this function runs at application startup and shutdown.
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Responsibilities:
        - Run initialization logic before the app starts serving requests.
        - Optionally run cleanup logic after the app shuts down.

    Currently:
        - Initializes the database (creates tables if needed).
    """
    # Initialize the database schema and connections on startup
    init_db()
    print("Database initialized successfully")

    # Yield control back to FastAPI to continue normal startup
    yield


# Main FastAPI application instance used by the ASGI server.
app = FastAPI(title="¥apper", lifespan=lifespan)

# Allowed origins for CORS (frontends that can access this backend)
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Register CORS middleware to allow cross-origin requests from the frontend.
# This is needed because the frontend (Vite/React) runs on a different port.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,                    # Trusted frontend origins
    allow_credentials=True,                   # Allow cookies/credentials
    # allow_methods=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly allow main HTTP verbs
    allow_headers=["*"],                      # Accept all custom request headers
)

# Register all routers so their endpoints become part of the API
app.include_router(ws_router)      # WebSocket chat functionality
app.include_router(user_router)    # User registration & management
app.include_router(room_router)    # Chat room creation & management
app.include_router(login_router)   # Login/authentication routes

from contextlib import asynccontextmanager
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware

from server.database import init_db
from server.websocket.routes import router as ws_router
from server.user.routes import router as user_router
from server.room.routes import router as room_router
from server.login.routes import router as login_router

# Execute before/after the lifetime of the app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initalize the database
    init_db()
    print("Database initialized successfully")

    yield

app = FastAPI(title="¥apper", lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    # allow_methods=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly include OPTIONS
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(user_router)
app.include_router(room_router)
app.include_router(login_router)


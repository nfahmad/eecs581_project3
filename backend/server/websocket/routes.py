"""
Program: EECS 581 Project 3 - Live Chat Application
File: routes.py (WebSocket Routes)
Description:
    Provides the primary WebSocket entry points for the chat application.
    This module enables:
      - Real-time messaging inside chat rooms via persistent WebSocket connections.
      - Retrieval of recent message history for a specific room.
    Uses the global ConnectionManager to track active sessions and broadcast messages.

Inputs:
    - WebSocket connection with room_id, user_id, and username query params.
    - GET requests for chat history retrieval.
    - Real-time message payloads received via WebSocket.

Outputs:
    - JSON-formatted messages broadcast back to connected clients.
    - Query results for message history retrieval.

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI WebSocket documentation
    - SQLAlchemy documentation
    - EECS 581 course materials
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from server.websocket.manager import manager
from server.database import Message, get_db
from datetime import datetime
import json

# All WebSocket-related routes use /ws prefix for clarity
router = APIRouter(prefix="/ws", tags=["websocket"])


@router.get("/{room_id}/messages")
async def get_room_messages(room_id: int, max: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve the most recent messages from a room.

    Args:
        room_id (int): ID of the chat room.
        max (int): Maximum number of messages to return (default: 100).
        db (Session): Dependency-injected SQLAlchemy session.

    Returns:
        List[Message]: List of message records stored in DB for the room.

    Notes:
        Often used when loading or refreshing chat history on room entry.
    """
    # Query message history for a specific room up to "max" limit
    messages = (
        db.query(Message)
        .where(Message.room_id == room_id)
        .limit(max)
        .all()
    )
    return messages


@router.websocket("/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    user_id: int = Query(...),      # Required query parameter
    username: str = Query(...),     # Required query parameter
):
    """
    WebSocket endpoint for real-time chat functionality.

    Connection URL format:
        ws://localhost:8000/ws/<room_id>?user_id=<id>&username=<name>

    Parameters (via Query):
        - user_id: ID of the connecting user
        - username: Display name associated with this user session
    """
    # Acquire a DB connection for message persistence
    db = next(get_db())

    try:
        # Register the WebSocket as connected and track room + user metadata
        await manager.connect(websocket, room_id, user_id, username)

        # Broadcast notification that a new user joined
        await manager.broadcast_to_room(
            db,
            room_id,
            user_id,
            {
                "type": "user_joined",
                "user_id": user_id,
                "username": username,
                "timestamp": datetime.now().isoformat(),
                "message": f"{username} joined the room :)",
            },
        )

        # Continuously listen for incoming messages
        while True:
            # Receive raw message text from the socket client
            data = await websocket.receive_text()

            try:
                # Parse into dictionary (expected format from the frontend)
                message_data = json.loads(data)
                content = message_data.get("content", "").strip()

                # Ignore empty or whitespace-only messages
                if not content:
                    continue

                # Broadcast a valid chat message to all room participants
                await manager.broadcast_to_room(
                    db,
                    room_id,
                    user_id,
                    {
                        "type": "message",
                        "content": content,
                        "user_id": user_id,
                        "username": username,
                        "room_id": room_id,
                        "timestamp": datetime.now().isoformat(),
                    },
                )

            except Exception as e:
                # Log malformed or failed message handling
                print(f"Error processing message: {e}")

    except WebSocketDisconnect:
        # Clean up lost connection and notify the room if metadata exists
        user_data = manager.disconnect(websocket)
        if user_data:
            await manager.broadcast_to_room(
                db,
                room_id,
                user_id,
                {
                    "type": "user_left",
                    "user_id": user_data["user_id"],
                    "username": user_data["username"],
                    "timestamp": datetime.now().isoformat(),
                    "message": f"{user_data['username']} left the room :(",
                },
            )


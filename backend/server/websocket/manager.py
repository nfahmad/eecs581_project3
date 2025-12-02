"""
Program: EECS 581 Project 3 - Live Chat Application
File: manager.py (WebSocket Connection Manager)
Description:
    Implements the ConnectionManager class, which maintains active WebSocket
    connections for chat rooms and handles broadcasting messages to all clients
    in a given room. Also persists chat messages to the database.

Inputs:
    - WebSocket connections initiated by clients.
    - room_id, user_id, and username when a client connects.
    - Message payloads to broadcast to all users in a room.
    - Database session (SQLAlchemy Session) for saving messages.

Outputs:
    - Real-time WebSocket messages sent to all connected clients in a room.
    - New rows in the Message table for each broadcasted message.
    - Updated internal state tracking active connections and user metadata.

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI WebSocket documentation
    - SQLAlchemy documentation
    - EECS 581 course materials
"""

from json import dumps as json_dump
from typing import Dict, List
from fastapi import WebSocket, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.database import Message


class ConnectionManager:
    """
    Manages all active WebSocket connections for chat rooms.

    Responsibilities:
        - Track which WebSockets (clients) are connected to which room.
        - Store basic user metadata for each WebSocket connection.
        - Handle new WebSocket connections and disconnections.
        - Broadcast messages to all users within a specific room.
        - Persist broadcast messages to the database.

    Internal data structures:
        active_connections: Dict[int, List[WebSocket]]
            Maps room_id -> list of WebSocket connections in that room.

        user_info: Dict[WebSocket, dict]
            Maps each WebSocket -> dictionary with user_id, username, room_id.
    """

    def __init__(self):
        # Dictionary mapping room_id to list of WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Dictionary mapping each WebSocket connection to its user metadata
        self.user_info: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, room_id: int, user_id: int, username: str):
        """
        Accept a new WebSocket connection and register it under a room.

        Steps:
            1. Accept the WebSocket handshake.
            2. Ensure the room has an entry in active_connections.
            3. Append this connection to the room's list.
            4. Store user metadata so we can identify the connection later.

        Args:
            websocket (WebSocket): The client's WebSocket connection.
            room_id (int): Room the user is joining.
            user_id (int): Unique ID of the user.
            username (str): Display name of the user.
        """
        # Complete the WebSocket handshake
        await websocket.accept()

        # If this room has no connections yet, initialize the list
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        # Track the WebSocket under the given room
        self.active_connections[room_id].append(websocket)

        # Save user metadata attached to this connection
        self.user_info[websocket] = {
            "user_id": user_id,
            "username": username,
            "room_id": room_id,
        }

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection from its associated room and clean up.

        Steps:
            1. Look up the connection in user_info to find its room_id.
            2. Remove the WebSocket from that room's active connection list.
            3. If the room has no more connections, remove the room entry.
            4. Delete the WebSocket's user metadata.

        Args:
            websocket (WebSocket): The connection to disconnect.

        Returns:
            dict | None:
                - User metadata dict (user_id, username, room_id) if found.
                - None if the websocket was not tracked.
        """
        if websocket in self.user_info:
            user_data = self.user_info[websocket]
            room_id = user_data["room_id"]

            # Remove the WebSocket from the room's connection list
            if room_id in self.active_connections:
                self.active_connections[room_id].remove(websocket)

                # If this room is now empty, remove it entirely from tracking
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]

            # Finally, drop the stored user metadata
            del self.user_info[websocket]
            return user_data

        # If the websocket was not found in user_info, nothing to do
        return None

    async def broadcast_to_room(self, db: Session, room_id: int, user_id: int, message: dict):
        """
        Broadcast a message to all active WebSocket connections in a room.

        This function also persists the message in the database before
        broadcasting to ensure chat history is stored.

        Args:
            db (Session): Active SQLAlchemy database session.
            room_id (int): ID of the room receiving the message.
            user_id (int): ID of the user who sent the message.
            message (dict): Structured payload to send to all clients.

        Raises:
            HTTPException(400): If the message cannot be saved due to
                                database constraints.

        Notes:
            - Disconnected or broken sockets are cleaned up automatically.
            - message is JSON-serialized for database storage.
        """
        if room_id in self.active_connections:
            # Persist the message before broadcasting so history is kept
            try:
                db_message = Message(
                    content=json_dump(message),  # Store raw JSON string in DB
                    user_id=user_id,
                    room_id=room_id,
                )
                db.add(db_message)
                db.commit()
            except IntegrityError:
                # If the insert fails (e.g., foreign key constraint), revert
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to add message due to database constraints",
                )

            disconnected = []  # Track connections that fail during broadcast

            # Iterate over each connection in the room and attempt to send
            for connection in self.active_connections[room_id]:
                try:
                    # Send the message as JSON over the WebSocket
                    await connection.send_json(message)
                except Exception as e:
                    # Any exception likely means the client disconnected
                    print(f"Error broadcasting to connection: {e}")
                    disconnected.append(connection)

            # Remove any connections that failed during the broadcast
            for connection in disconnected:
                self.disconnect(connection)


# Global connection manager instance used across the application.
# This singleton-style object allows all routes to share the same
# connection state for WebSockets without recreating managers.
manager = ConnectionManager()


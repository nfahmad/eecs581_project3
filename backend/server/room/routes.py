"""
Program: EECS 581 Project 3 - Live Chat Application
File: routes.py (Room Management Router)
Description:
    Defines REST API endpoints for CRUD operations related to chat rooms.
    This includes fetching all rooms, creating new rooms, updating room names,
    and deleting rooms. Operations interact with the database through SQLAlchemy.

Inputs:
    - HTTP requests that provide:
        * Room creation details (name, description, creator_id)
        * Room ID for delete/update requests
        * New room name when patching
    - Database session dependency (get_db)

Outputs:
    - JSON responses with room details (GET and POST)
    - Empty responses with status codes for DELETE and PATCH

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI documentation
    - SQLAlchemy documentation
    - EECS 581 course materials
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.database import get_db, Room
from server.room.schemas import (
    CreateRoomReq,
    CreateRoomRes,
)

# Router to manage all requests related to "Rooms" functionality.
router = APIRouter(prefix="/room", tags=["Rooms"])


@router.get("/")
async def get_rooms(db: Session = Depends(get_db)) -> List[CreateRoomRes]:
    """
    Retrieve all existing chat rooms from the database.

    Args:
        db (Session): Database connection provided by FastAPI.

    Returns:
        List[CreateRoomRes]: List of all room records.

    Notes:
        This endpoint allows the frontend to display all joinable rooms.
    """
    # Query for every room entry stored in the database
    rooms = db.query(Room).all()
    return rooms


@router.post("/")
async def create_room(room_info: CreateRoomReq, db: Session = Depends(get_db)) -> CreateRoomRes:
    """
    Create a new chat room with the given name, description, and creator.

    Args:
        room_info (CreateRoomReq): Input data needed to define a room.
        db (Session): Database connection dependency.

    Returns:
        CreateRoomRes: The newly created room record.

    Raises:
        HTTPException(400): If room creation violates a DB constraint
                            (room name already exists).
    """
    # Create a Room ORM object from validated request data
    new_room = Room(
        name=room_info.name,
        description=room_info.description,
        creator_id=room_info.creator_id,
    )

    try:
        # Add room to DB session for insertion
        db.add(new_room)
        db.commit()  # Persist changes to database
        db.refresh(new_room)  # Reload instance with updated values (e.g., ID)
    except IntegrityError:
        # Rollback ensures DB is not left in a broken transaction state
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create room {room_info.name}",
        )

    # Return the newly created room data back to the client
    return new_room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific room by its ID.

    Args:
        room_id (int): Unique identifier of the room to delete.
        db (Session): Database connection dependency.

    Raises:
        HTTPException(404): If the room does not exist.

    Notes:
        This operation is irreversible and returns no response body on success.
    """
    # Check if the room exists before deletion
    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # Remove room permanently
    db.delete(room)
    db.commit()


@router.patch("/{room_id}/name", status_code=status.HTTP_204_NO_CONTENT)
async def update_room_name(room_id: int, val: str, db: Session = Depends(get_db)):
    """
    Update only the room name field for an existing room.

    Args:
        room_id (int): Room being modified.
        val (str): The updated room name.
        db (Session): Database session dependency.

    Raises:
        HTTPException(404): If the room does not exist.

    Notes:
        Using PATCH ensures only part of the record is updated.
    """
    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # Dynamically update room.name field
    setattr(room, "name", val)

    db.commit()
    db.refresh(room)  # Sync updated field with in-memory object


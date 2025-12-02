"""
Program: EECS 581 Project 3 - Live Chat Application
File: schemas.py (Room Request & Response Schemas)
Description:
    Contains Pydantic models that define the data structure for room-related
    requests and responses. These models ensure validation of incoming data for
    creating rooms and standardize the JSON format returned to clients when
    retrieving room details.

Inputs:
    - Data provided by clients when creating or updating chat rooms.
    - Database-derived data returned in API responses.

Outputs:
    - Validated Pydantic models that FastAPI uses for serialization and typing.

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI / Pydantic documentation
    - EECS 581 course materials
"""

from pydantic import BaseModel
from datetime import datetime


class BaseRoom(BaseModel):
    """
    Base schema shared by multiple room-related models.

    Fields:
        name (str): The display name for the room.
        description (str): A short summary of the room's purpose.

    Notes:
        This reusable base helps maintain consistency among derived schemas.
    """
    name: str
    description: str


class CreateRoomReq(BaseRoom):
    """
    Schema for validating room creation requests from the client.

    Fields:
        creator_id (int): ID of the user who creates the room.
                          Used to maintain creator ownership.
    """
    creator_id: int


class CreateRoomRes(CreateRoomReq):
    """
    Schema for room creation responses.

    Extends CreateRoomReq to include fields automatically generated
    by the database at creation time.

    Fields:
        id (int): Auto-assigned unique identifier for the room.
        created_at (datetime): Timestamp when the room was created.
        updated_at (datetime): Timestamp of the most recent update.
    """
    id: int
    created_at: datetime
    updated_at: datetime


class GetRoomRes(BaseRoom):
    """
    Schema for retrieving room info in a lightweight manner.

    Fields:
        id (int): Unique room identifier returned in GET requests.

    Used where full metadata is unnecessary (e.g., room listing).
    """
    id: int

"""
Program: EECS 581 Project 3 - Live Chat Application
File: schemas.py (Shared User Schemas - Optional Extension Layer)
Description:
    Defines Pydantic models for validating and serializing user-related data.
    These models support:
        - User creation
        - User profile updates
        - API-safe user responses

    This file may represent additional schema capabilities (PATCH updates)
    compared to the primary schemas in `server/user/schemas.py`.

Inputs:
    - JSON payloads submitted from the client for user registration and profile updates.

Outputs:
    - Validated user objects for FastAPI routes.
    - Safe data serialization that excludes sensitive fields (e.g., passwords).

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - Pydantic documentation (Field validators)
    - FastAPI documentation
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """
    Base attributes that are always required (or allowed) for a user.

    Field Constraints:
        username: Must be between 3–50 characters long.
        email: Automatically validated as a proper email address.

    Notes:
        Field(...) indicates that a field is required.
    """
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    """
    Payload required when creating a new user.

    Fields:
        password: Required; must be 6+ characters before hashing.

    Notes:
        The password is NOT exposed in responses.
    """
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """
    Optional fields for updating user attributes.

    Use case:
        - PATCH /user/{id}
        - Supports updating only part of a user profile.

    Fields:
        username: Optional update; 3–50 characters if provided.
        email: Optional; validated if provided.
        password: Optional; 6+ characters if provided.

    Notes:
        Allows partial updates without overwriting unchanged fields.
    """
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(UserBase):
    """
    Schema returned when sending user information back to the client.

    Contains:
        - Public-safe fields only
        - DB-managed timestamps and auto-generated ID

    Fields:
        id: Unique identifier for the user.
        created_at: Timestamp of record creation.
        updated_at: Timestamp of most recent change.

    Config:
        from_attributes = True
            Allows Pydantic to convert from ORM objects directly.
    """
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        # Enables ORM mode-style conversion (SQLAlchemy -> Pydantic)
        from_attributes = True

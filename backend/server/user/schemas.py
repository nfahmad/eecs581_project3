"""
Program: EECS 581 Project 3 - Live Chat Application
File: schemas.py (User Request & Response Schemas)
Description:
    Defines Pydantic models that validate and structure user-related data
    for the FastAPI endpoints. These schemas ensure request payloads contain
    the expected data types and formats (e.g., email validation), and
    provide typed responses when returning user information.

Inputs:
    - Data from client requests (new account creation, user lookups)
    - Data from database queries returned to the client

Outputs:
    - Validated and serialized JSON objects following Pydantic model structure

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI & Pydantic documentation
    - EECS 581 course materials
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime


class BaseUser(BaseModel):
    """
    Base user schema used by multiple request/response models.

    Fields:
        username (str): Display name chosen by the user; must be unique.
        email (EmailStr): Email field automatically validated for proper format.

    Notes:
        This helps avoid duplication of common fields across user schemas.
    """
    username: str
    email: EmailStr


class CreateUserReq(BaseUser):
    """
    Schema for validating user account creation requests.

    Fields:
        password (str): Raw password provided by the user.
                        It will be hashed before saving in the database.

    Notes:
        Pydantic ensures the payload includes all required fields.
    """
    password: str


class CreateUserRes(BaseUser):
    """
    Response schema returned when a new user is successfully created.

    Extends BaseUser with database-generated metadata.

    Fields:
        id (int): Unique ID assigned by the database.
        created_at (datetime): When the user entry was created.
        updated_at (datetime): Last update timestamp for this user record.
    """
    id: int
    created_at: datetime
    updated_at: datetime


class GetUserRes(BaseUser):
    """
    Schema used when retrieving user info (by ID).

    Fields:
        id (int): The unique identifier for the user.

    Notes:
        A lightweight model used for basic user lookups in GET endpoints.
    """
    id: int



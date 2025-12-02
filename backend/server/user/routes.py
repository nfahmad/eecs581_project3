"""
Program: EECS 581 Project 3 - Live Chat Application
File: routes.py (User Management Router)
Description:
    Defines REST API operations for managing user accounts. This includes
    creating new users, retrieving user details, and deleting accounts.
    Performs necessary data validation and interacts with the database
    using SQLAlchemy to ensure consistency and uniqueness.

Inputs:
    - JSON payloads for account creation via CreateUserReq schema.
    - Path parameters for retrieving or deleting specific users.
    - Database session via FastAPI dependency injection.

Outputs:
    - JSON responses that follow GetUserRes / CreateUserRes schemas.
    - HTTP status codes indicating the success or failure of actions.

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI documentation
    - SQLAlchemy documentation
    - EECS 581 course materials
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.database import get_db, User
from server.util import hash_password
from server.user.schemas import (
    CreateUserReq,
    CreateUserRes,
    GetUserRes,
)

# Router with "/user" prefix for all endpoints managing users.
router = APIRouter(prefix="/user", tags=["Users"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(user_info: CreateUserReq, db: Session = Depends(get_db)) -> CreateUserRes:
    """
    Create a new user account.

    Validates uniqueness of username and email before inserting the new user.
    Password hashing occurs here to ensure the database never stores raw passwords.

    Args:
        user_info (CreateUserReq): Payload containing new user details.
        db (Session): Active DB connection.

    Returns:
        CreateUserRes: Data about the newly created user.

    Raises:
        HTTPException(400): If username or email already exists, or DB constraints fail.
    """

    # Prevent duplicate usernames:
    # Query checks if username exists before insertion
    user_from_username = db.query(User).filter(User.username == user_info.username).first()
    if user_from_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with username ({user_from_username.username}) already exists",
        )

    # Prevent duplicate email registration
    user_from_email = db.query(User).filter(User.email == user_info.email).first()
    if user_from_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email ({user_from_email.email}) already exists",
        )

    # Create new user object with hashed password for security
    new_user = User(
        username=user_info.username,
        email=user_info.email,
        hashed_password=hash_password(user_info.password),
    )

    try:
        # Attempt to save the new user to the DB
        db.add(new_user)
        db.commit()  # Finalize transaction
        db.refresh(new_user)  # Load DB-generated fields like ID
    except IntegrityError:
        # Rollback ensures DB stays consistent if write fails
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to add user due to database constraints",
        )

    return new_user


@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)) -> GetUserRes:
    """
    Retrieve a specific user by ID.

    Args:
        user_id (int): ID of the user to retrieve.
        db (Session): Database session dependency.

    Returns:
        GetUserRes: The user record if found.

    Raises:
        HTTPException(404): If no user exists with given ID.
    """

    # Search for user record based on primary key
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} does not exist",
        )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Permanently remove a user record by ID.

    Args:
        user_id (int): ID of the user to delete.
        db (Session): Active DB session.

    Raises:
        HTTPException(404): If the user does not exist.

    Notes:
        Returns 204 No Content since deletion has no response body.
    """

    # Validate existence of the user before deletion
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} does not exist",
        )

    db.delete(user)
    db.commit()  # Persist deletion in the database


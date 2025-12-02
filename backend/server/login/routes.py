"""
Program: EECS 581 Project 3 - Live Chat Application
File: routes.py (Login Router)
Description:
    Defines the API routes for user login. This module exposes a POST endpoint
    that validates user credentials (username/email + password) against the
    database and returns basic user information on successful authentication.

Inputs:
    - HTTP POST request body matching the LoginReq schema:
        * username: str  (can be either email or username)
        * password: str
    - Database session injected via FastAPI dependency (get_db).

Outputs:
    - On success: JSON response matching GetUserRes schema:
        * username: str
        * email: str
        * id: int
    - On failure:
        * 404 Not Found if user does not exist.
        * 400 Bad Request if password is invalid.

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - FastAPI documentation
    - SQLAlchemy documentation
    - EECS 581 course materials
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from server.user.schemas import GetUserRes
from server.login.schemas import LoginReq
from server.database import get_db, User
from server.util import verify_password

# Create a router specifically for login-related routes.
# All routes in this file will be prefixed with "/login"
router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/")
async def login_user(login_data: LoginReq, db: Session = Depends(get_db)) -> GetUserRes:
    """
    Authenticate a user using their username/email and password.

    This endpoint:
    1. Looks up a user record where the provided login identifier matches
       either the email or username stored in the database.
    2. If a user is found, it verifies the provided password against the
       stored hashed password.
    3. On success, it returns a subset of user information (username, email, id).
    4. On failure, it raises an HTTPException with an appropriate status code.

    Args:
        login_data (LoginReq):
            The login payload that contains the username (or email)
            and plain-text password sent by the client.
        db (Session):
            Database session provided by FastAPI's dependency injection.

    Returns:
        GetUserRes:
            A dictionary-like object containing the authenticated user's
            username, email, and id.

    Raises:
        HTTPException:
            - 404 NOT FOUND if no matching user record exists.
            - 400 BAD REQUEST if the password does not match the stored hash.
    """

    # Attempt to find a user whose email or username matches the provided identifier.
    # Note: The login_data.username field can represent either the user's email
    #       or their username, giving the client flexibility in how they log in.
    user = (
        db.query(User)
        .filter(
            User.email == login_data.username
            or User.username == login_data.username
        )
        .first()
    )

    # If no user was found with the given identifier, return a 404 error.
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not found.",
        )

    # If a user exists, verify that the provided password matches the stored hash.
    # verify_password() encapsulates the hashing and comparison logic.
    if verify_password(user.hashed_password, login_data.password):
        # On successful authentication, return basic user info to the client.
        # This can be used by the frontend to store user context
        return {
            "username": user.username,
            "email": user.email,
            "id": user.id,
        }

    # If the password is incorrect, raise a 400 error indicating invalid credentials.
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid login",
    )

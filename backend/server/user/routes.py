from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.database import get_db, User
from server.util import hash_password 
from server.user.schemas import (
    CreateUserReq,
    CreateUserRes,
    GetUserRes
)

router = APIRouter(prefix="/user", tags=["Users"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(user_info: CreateUserReq, db: Session = Depends(get_db)) -> CreateUserRes:
    # User with username already exists
    user_from_username = db.query(User).filter(User.username == user_info.username).first()
    if user_from_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with username ({user_from_username.username}) already exists"
        )

    # User with email already exists
    user_from_email = db.query(User).filter(User.email == user_info.email).first()
    if user_from_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email ({user_from_email.email}) already exists"
        )

    # Create user
    new_user = User(
        username=user_info.username,
        email=user_info.email,
        hashed_password=hash_password(user_info.password)
    )

    try:
        # Try and commit the new user to the databse
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        # There was an issue with adding the user
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to add user due to database constraints"
        )

    return new_user

@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)) -> GetUserRes:
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} does not exist"
        )

    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} does not exist"
        )

    db.delete(user)
    db.commit()


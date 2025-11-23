from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.database import get_db, Room
from server.room.schemas import (
    CreateRoomReq,
    CreateRoomRes,
)

router = APIRouter(prefix="/room", tags=["Rooms"])

@router.get("/")
async def get_rooms(db: Session = Depends(get_db)) -> List[CreateRoomRes]:
    rooms = db.query(Room).all()
    return list(rooms)

@router.post("/")
async def create_room(room_info: CreateRoomReq, db: Session = Depends(get_db)) -> CreateRoomRes:
    new_room = Room(
        name = room_info.name,
        description = room_info.description,
        creator_id = room_info.creator_id
    )

    try:
        db.add(new_room)
        db.commit()
        db.refresh(new_room)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create room {room_info.name}"
        )

    return new_room

@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    db.delete(room)
    db.commit()

@router.patch("/{room_id}/name", status_code=status.HTTP_204_NO_CONTENT)
async def update_room_name(room_id: int, val: str, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    setattr(room, "name", val)

    db.commit()
    db.refresh(room)


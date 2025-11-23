from pydantic import BaseModel
from datetime import datetime

class BaseRoom(BaseModel):
    name: str
    description: str

class CreateRoomReq(BaseRoom):
    creator_id: int

class CreateRoomRes(CreateRoomReq):
    id: int
    created_at: datetime
    updated_at: datetime

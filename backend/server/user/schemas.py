from pydantic import BaseModel, EmailStr
from datetime import datetime

class BaseUser(BaseModel):
    username: str
    email: EmailStr

class CreateUserReq(BaseUser):
    password: str

class CreateUserRes(BaseUser):
    id: int
    created_at: datetime
    updated_at: datetime

class GetUserRes(BaseUser):
    id: int


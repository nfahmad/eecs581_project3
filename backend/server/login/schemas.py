from pydantic import BaseModel, EmailStr

class LoginReq(BaseModel):
    username: str | EmailStr
    password: str


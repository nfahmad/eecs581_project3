from fastapi import APIRouter, HTTPException, Depends,  status
from sqlalchemy.orm import Session

from server.user.schemas import GetUserRes
from server.login.schemas import LoginReq
from server.database import get_db, User
from server.util import verify_password

router = APIRouter(prefix="login", tags=["Login"])

@router.post("/")
async def login_user(login_data: LoginReq, db: Session = Depends(get_db)) -> GetUserRes:
    user = db.query(User).filter(User.email == login_data.username or User.username == login_data.username).first()

    if not user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "User was not found."
        )

    if verify_password(user.hashed_password, login_data.password):
        return



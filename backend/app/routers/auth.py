from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdmissionPreference, City, Profile, User
from app.schemas import LoginIn, RegisterIn, TokenOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    exists = db.scalar(select(User).where(User.email == str(body.email)))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if body.city_id is not None and not db.get(City, body.city_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown city")

    user = User(
        email=str(body.email).lower(),
        hashed_password=hash_password(body.password),
        role="user",
    )
    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id,
        full_name=body.full_name,
        age=body.age,
        city_id=body.city_id,
    )
    db.add(profile)
    db.add(AdmissionPreference(user_id=user.id))
    db.commit()

    token = create_access_token(user_id=user.id, role=user.role)
    return TokenOut(access_token=token)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(body.email).lower()))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user_id=user.id, role=user.role)
    return TokenOut(access_token=token)

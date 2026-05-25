from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import City
from app.schemas import CityOut

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/cities", response_model=list[CityOut])
def public_cities(db: Session = Depends(get_db)):
    return db.scalars(select(City).order_by(City.name)).all()

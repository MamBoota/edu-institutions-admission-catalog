from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import City, Institution, Review, User
from app.schemas import CityWithStatsOut

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=list[CityWithStatsOut])
def list_cities(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    avg_rating = func.avg(Review.rating).label("avg_rating")
    review_count = func.count(Review.id).label("review_count")

    stmt = (
        select(City, avg_rating, review_count)
        .outerjoin(Institution, Institution.city_id == City.id)
        .outerjoin(Review, Review.institution_id == Institution.id)
        .group_by(City.id)
        .order_by(City.name)
    )
    rows = db.execute(stmt).all()
    out: list[CityWithStatsOut] = []
    for city, avg_r, cnt in rows:
        out.append(
            CityWithStatsOut(
                id=city.id,
                name=city.name,
                slug=city.slug,
                avg_rating=float(avg_r) if avg_r is not None else None,
                review_count=int(cnt or 0),
            )
        )
    return out

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import AdmissionPreference, City, Institution, Review, User
from app.schemas import InstitutionCreateIn, InstitutionOut, ReviewIn, ReviewOut

router = APIRouter(prefix="/institutions", tags=["institutions"])


def _institution_stats(db: Session, inst: Institution) -> tuple[float | None, int]:
    q = select(func.avg(Review.rating), func.count(Review.id)).where(Review.institution_id == inst.id)
    avg_r, cnt = db.execute(q).one()
    return (float(avg_r) if avg_r is not None else None, int(cnt or 0))


def _to_institution_out(db: Session, inst: Institution) -> InstitutionOut:
    city = db.get(City, inst.city_id)
    avg_rating, review_count = _institution_stats(db, inst)
    return InstitutionOut(
        id=inst.id,
        name=inst.name,
        city_id=inst.city_id,
        city_name=city.name if city else None,
        description=inst.description,
        avg_rating=avg_rating,
        review_count=review_count,
    )


@router.get("", response_model=list[InstitutionOut])
def list_institutions(
    city_id: int | None = None,
    q: str | None = None,
    apply_saved_filter: bool = Query(True),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Institution)
    pref = db.get(AdmissionPreference, user.id)
    if apply_saved_filter and city_id is None and pref and pref.preferred_city_id:
        city_id = pref.preferred_city_id
    if city_id is not None:
        stmt = stmt.where(Institution.city_id == city_id)
    if q:
        stmt = stmt.where(Institution.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Institution.name)
    insts = db.scalars(stmt).all()
    return [_to_institution_out(db, i) for i in insts]


@router.get("/{institution_id}", response_model=InstitutionOut)
def get_institution(
    institution_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    inst = db.get(Institution, institution_id)
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return _to_institution_out(db, inst)


@router.get("/{institution_id}/reviews", response_model=list[ReviewOut])
def list_reviews(
    institution_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not db.get(Institution, institution_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    rows = db.scalars(
        select(Review).where(Review.institution_id == institution_id).order_by(Review.created_at.desc())
    ).all()
    return [ReviewOut.model_validate(r) for r in rows]


@router.post("/{institution_id}/reviews", response_model=ReviewOut)
def add_review(
    institution_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Institution, institution_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    rev = Review(
        user_id=user.id,
        institution_id=institution_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return ReviewOut.model_validate(rev)


@router.post("", response_model=InstitutionOut, dependencies=[Depends(require_admin)])
def create_institution(body: InstitutionCreateIn, db: Session = Depends(get_db)):
    if not db.get(City, body.city_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown city")
    inst = Institution(name=body.name, city_id=body.city_id, description=body.description)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return _to_institution_out(db, inst)

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Favorite, Institution, User
from app.routers.institutions import _to_institution_out
from app.schemas import FavoriteOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteOut])
def list_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(Favorite).where(Favorite.user_id == user.id)).all()
    out: list[FavoriteOut] = []
    for fav in rows:
        inst = db.get(Institution, fav.institution_id)
        if inst:
            out.append(FavoriteOut(institution=_to_institution_out(db, inst)))
    return out


@router.post("/{institution_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    institution_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Institution, institution_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    exists = db.scalar(
        select(Favorite).where(
            Favorite.user_id == user.id, Favorite.institution_id == institution_id
        )
    )
    if exists:
        return {"ok": True}
    db.add(Favorite(user_id=user.id, institution_id=institution_id))
    db.commit()
    return {"ok": True}


@router.delete("/{institution_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    institution_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    fav = db.scalar(
        select(Favorite).where(
            Favorite.user_id == user.id, Favorite.institution_id == institution_id
        )
    )
    if fav:
        db.delete(fav)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

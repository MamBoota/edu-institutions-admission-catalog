from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import AdmissionPreference, City, Profile, User
from app.schemas import MeOut, PreferencesIn, PreferencesOut, ProfileOut, ProfilePatchIn, UserBrief

router = APIRouter(prefix="/me", tags=["me"])


def _profile_out(db: Session, profile: Profile | None) -> ProfileOut | None:
    if not profile:
        return None
    city_name = None
    if profile.city_id:
        c = db.get(City, profile.city_id)
        city_name = c.name if c else None
    return ProfileOut(
        full_name=profile.full_name,
        age=profile.age,
        city_id=profile.city_id,
        city_name=city_name,
    )


@router.get("", response_model=MeOut)
def read_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.get(Profile, user.id)
    return MeOut(user=UserBrief.model_validate(user), profile=_profile_out(db, profile))


@router.patch("/profile", response_model=MeOut)
def patch_profile(
    body: ProfilePatchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.get(Profile, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile missing")
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update")
    if "full_name" in data and data["full_name"] is not None:
        profile.full_name = data["full_name"]
    if "age" in data and data["age"] is not None:
        profile.age = data["age"]
    if "city_id" in data:
        cid = data["city_id"]
        if cid is not None and not db.get(City, cid):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown city")
        profile.city_id = cid
    db.commit()
    db.refresh(profile)
    return MeOut(user=UserBrief.model_validate(user), profile=_profile_out(db, profile))


@router.get("/preferences", response_model=PreferencesOut)
def get_preferences(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.get(AdmissionPreference, user.id)
    if not pref:
        return PreferencesOut()
    city_name = None
    if pref.preferred_city_id:
        c = db.get(City, pref.preferred_city_id)
        city_name = c.name if c else None
    return PreferencesOut(
        preferred_city_id=pref.preferred_city_id,
        preferred_city_name=city_name,
        study_direction=pref.study_direction,
    )


@router.put("/preferences", response_model=PreferencesOut)
def put_preferences(
    body: PreferencesIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.get(AdmissionPreference, user.id)
    if not pref:
        pref = AdmissionPreference(user_id=user.id)
        db.add(pref)
        db.flush()
    if body.preferred_city_id is None:
        pref.preferred_city_id = None
    else:
        if not db.get(City, body.preferred_city_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown city")
        pref.preferred_city_id = body.preferred_city_id
    pref.study_direction = body.study_direction
    db.commit()
    db.refresh(pref)
    city_name = None
    if pref.preferred_city_id:
        c = db.get(City, pref.preferred_city_id)
        city_name = c.name if c else None
    return PreferencesOut(
        preferred_city_id=pref.preferred_city_id,
        preferred_city_name=city_name,
        study_direction=pref.study_direction,
    )

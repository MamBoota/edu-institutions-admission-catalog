from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBrief(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=200)
    age: int = Field(ge=10, le=100)
    city_id: int | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileOut(BaseModel):
    full_name: str
    age: int
    city_id: int | None = None
    city_name: str | None = None


class MeOut(BaseModel):
    user: UserBrief
    profile: ProfileOut | None = None


class ProfilePatchIn(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    age: int | None = Field(default=None, ge=10, le=100)
    city_id: int | None = None


class CityOut(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class CityWithStatsOut(CityOut):
    avg_rating: float | None = None
    review_count: int = 0


class InstitutionOut(BaseModel):
    id: int
    name: str
    city_id: int
    city_name: str | None = None
    description: str | None = None
    avg_rating: float | None = None
    review_count: int = 0

    model_config = {"from_attributes": True}


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    id: int
    user_id: int
    institution_id: int
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PreferencesIn(BaseModel):
    preferred_city_id: int | None = None
    study_direction: str | None = Field(default=None, max_length=200)


class PreferencesOut(BaseModel):
    preferred_city_id: int | None = None
    preferred_city_name: str | None = None
    study_direction: str | None = None


class InstitutionCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=300)
    city_id: int
    description: str | None = None


class FavoriteOut(BaseModel):
    institution: InstitutionOut

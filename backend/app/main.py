from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, get_db, init_engine
from app.routers import auth, cities, favorites, institutions, me, public
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = init_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(cities.router, prefix="/api")
app.include_router(institutions.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}

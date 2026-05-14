from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


def _connect_args(url: str) -> dict:
    if url.startswith("sqlite"):
        return {"check_same_thread": False}
    scheme = url.split("://", 1)[0] if "://" in url else ""
    if "mysql" in scheme:
        # чтобы не «висеть» минутами при неверном порте/хосте
        return {"connect_timeout": 15}
    return {}


engine = None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False)


def init_engine(database_url: str):
    global engine
    engine = create_engine(
        database_url,
        connect_args=_connect_args(database_url),
        pool_pre_ping=True,
    )
    SessionLocal.configure(bind=engine)
    return engine


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

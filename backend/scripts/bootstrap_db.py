#!/usr/bin/env python3
"""
Создаёт таблицы (SQLAlchemy) и выполняет сиды на пустой БД.
Запуск из каталога backend, с файлом .env (DATABASE_URL на MySQL/Postgres/SQLite).

  cd backend && . .venv/bin/activate && pip install -r requirements.txt
  cp .env.example .env   # заполните DATABASE_URL и JWT_SECRET
  python scripts/bootstrap_db.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

# Частые ошибки: скопировали слова из инструкции вместо значений из панели REG.RU
_BAD_MYSQL_HOSTS = frozenset(
    {
        "host",
        "hostname",
        "mysql",
        "your_mysql_host",
        "хост",
    }
)
_BAD_MYSQL_DB = frozenset({"dbname", "database", "имя_бд"})


def _safe_url_display(url: str) -> str:
    try:
        u = urlparse(url)
        host = u.hostname or "?"
        port = f":{u.port}" if u.port else ""
        db = (u.path or "").lstrip("/").split("?")[0] or "?"
        return f"{u.scheme}://***:**@{host}{port}/{db}"
    except Exception:
        return "(не удалось разобрать URL)"


def _validate_mysql_url(url: str) -> None:
    u = urlparse(url)
    if u.scheme not in ("mysql", "mysql+pymysql"):
        return
    host = (u.hostname or "").strip()
    if not host:
        print(
            "Ошибка: в DATABASE_URL не указан хост MySQL (между @ и :3306).\n"
            "Возьмите хост из ISPmanager REG.RU (часто serverXXX.hosting.reg.ru или localhost только с сервера хостинга).",
            file=sys.stderr,
        )
        sys.exit(2)
    host_lower = host.lower()
    if host_lower in _BAD_MYSQL_HOSTS:
        print(
            "Ошибка: в качестве хоста указано слово-заглушка («host» / «хост»), а не реальный сервер из панели REG.RU.\n"
            "Откройте ISPmanager → Базы данных → MySQL: там будет строка подключения или поле «Сервер» / «Хост».\n"
            "Подставьте её в DATABASE_URL без кириллицы-заглушек.",
            file=sys.stderr,
        )
        sys.exit(2)
    db = unquote((u.path or "").strip("/").split("?")[0])
    if not db or db.lower() in _BAD_MYSQL_DB:
        print(
            "Ошибка: имя базы в URL пустое или это заглушка (dbname и т.п.).\n"
            "Подставьте реальное имя БД из панели (часто с префиксом u1234567_…).",
            file=sys.stderr,
        )
        sys.exit(2)

    port = u.port
    if port in (1500, 443, 80, 8443):
        print(
            f"Ошибка: в URL указан порт {port} — это обычно веб (панель ISPmanager / HTTPS), а не MySQL.\n"
            "Для MySQL на REG.RU почти всегда порт **3306**. Пример:\n"
            "  mysql+pymysql://ЛОГИН:ПАРОЛЬ@server109.hosting.reg.ru:3306/ИМЯ_БАЗЫ?charset=utf8mb4\n"
            "Порт можно не писать — тогда подставится 3306 по умолчанию:\n"
            "  mysql+pymysql://ЛОГИН:ПАРОЛЬ@server109.hosting.reg.ru/ИМЯ_БАЗЫ?charset=utf8mb4",
            file=sys.stderr,
        )
        sys.exit(2)


def main() -> None:
    from app.config import settings
    from app.database import Base, SessionLocal, init_engine
    from app.seed import seed_if_empty

    print("Подключение:", _safe_url_display(settings.database_url))
    _validate_mysql_url(settings.database_url)

    try:
        eng = init_engine(settings.database_url)
        Base.metadata.create_all(bind=eng)
    except Exception as e:
        err = str(e).lower()
        if "1045" in err or "access denied" in err:
            print(
                "\nMySQL ответил «доступ запрещён» (ошибка 1045). Проверь по очереди:\n"
                "  1) **Пароль** в DATABASE_URL совпадает с паролем пользователя БД в ISPmanager (скопируй заново; спецсимволы в пароле — только через URL-кодирование).\n"
                "  2) **Логин** — это именно пользователь **MySQL**, а не логин в панель хостинга (часто `u3499900_что-то` из раздела «Пользователи БД»).\n"
                "  3) Пользователю могли выдать доступ только с **localhost**. Тогда с твоего IP (`…` в сообщении MySQL) вход запрещён — в панели REG.RU ищи «удалённый доступ к MySQL» / привязку хоста `%` или запускай `make db-bootstrap` по **SSH на сервере** с `...@localhost/...` в URL.\n",
                file=sys.stderr,
            )
            raise SystemExit(2) from e
        if (
            "nodename nor servname" in err
            or "gaierror" in err
            or "2003" in err
            or "can't connect to mysql" in err
        ):
            print(
                "\nMySQL недоступен по этому адресу. Частые причины:\n"
                "  1) В .env вместо реального хоста из панели REG.RU указана заглушка (например слово «хост» кириллицей).\n"
                "  2) С Mac на shared-хостинг MySQL снаружи часто не пускают — запустите `make db-bootstrap` по SSH на сервере с HOST=localhost в DATABASE_URL.\n"
                "  3) Порт в URL должен быть **3306** (MySQL), не **1500** (веб-панель ISPmanager).\n",
                file=sys.stderr,
            )
            raise SystemExit(2) from e
        raise

    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    print("Готово: таблицы созданы, сиды выполнены (если пользователей ещё не было).")


if __name__ == "__main__":
    main()

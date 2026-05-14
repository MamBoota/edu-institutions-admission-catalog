# edu-institutions-admission-catalog

**Русское название диплома:** Разработка веб-сервиса каталога образовательных учреждений для поступления.

Веб-приложение: **React (Vite)** + **FastAPI (Python)** + **PostgreSQL** (или SQLite для быстрого старта). Инфраструктура **Terraform** из старого репозитория удалена.

## Возможности (MVP)

- Регистрация и вход; без авторизации доступны только `/login`, `/register` и публичный список городов для анкеты.
- Роли **`user`** и **`admin`** (демо-логины ниже).
- Профиль: ФИО, возраст, город; предпочтения поступления (город, направление) как фильтр каталога.
- Города с **средней оценкой** и **числом отзывов**; на фронте список **автообновляется каждые 15 с** (демо «почти в реальном времени»).
- Каталог учреждений, карточка, отзывы, избранное.
- Админ: создание учреждения через API/UI.

## Быстрый старт (SQLite, без Docker)

```bash
make install-backend
make install-frontend
```

Один терминал из **корня репозитория** (где лежат `Makefile`, `backend/`, `frontend/`):

```bash
make start
```

Сначала выполняется **preflight** (импорт приложения, `compileall`, сборка фронта), затем поднимается API на `:8000`, проверяются `/api/health` и `/api/public/cities`, после этого запускается Vite на `http://127.0.0.1:5173`. Лог бэкенда: `.dev/backend.log`.

Остановка API и Vite (в другом терминале или после выхода из сценария):

```bash
make stop
```

`Ctrl+C` в терминале, где шёл `make start`, тоже останавливает бэкенд (обработчик в скрипте).

### Вручную (два терминала)

```bash
cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env   # при необходимости поправьте JWT_SECRET
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

Откройте `http://127.0.0.1:5173`. Vite проксирует `/api` на `http://127.0.0.1:8000`.

Если порты 8000 / 5173 заняты, сначала `make stop`.

### Псевдоним на базе своего домена (только у себя на ПК)

Нужен «красивый» хост вместо `127.0.0.1`, **без покупки второго домена**: берёте **поддомен или имя от своего домена** как метку и прописываете его локально.

1. Придумайте имя, например **`catalog.dev`** или **`edu.mydomain.test`** (суффикс `.test` / `.localhost` / вымышленное `something.yourrealdomain.local` — только для `/etc/hosts`, в интернет это не уходит).
2. Откройте **`/etc/hosts`** (macOS/Linux, нужны права администратора) и добавьте строку:
   ```text
   127.0.0.1   catalog.dev
   ```
   (вместо `catalog.dev` — ваш псевдоним.)
3. Запуск Vite с этим хостом:
   ```bash
   cd frontend && npm run dev -- --host catalog.dev
   ```
   В браузере: `http://catalog.dev:5173` — запросы к `/api` по-прежнему проксируются на `127.0.0.1:8000`, отдельно настраивать CORS для этого обычно **не нужно**, если фронт ходит только на относительный путь `/api`.
4. Если когда-нибудь зададите **`VITE_API_BASE`** на полный URL бэкенда с другого origin — добавьте этот origin в **`CORS_ORIGINS`** в `backend/.env`.

**В продакшене** тот же псевдоним можно сделать «настоящим»: у регистратора DNS запись **A** или **CNAME** на IP сервера, TLS (Let’s Encrypt) — уже на хостинге.

При первом запуске создаётся локальная БД `backend/edu_catalog.db` и **сиды** (города, учреждения, демо-пользователи).

### Демо-аккаунты

| Роль  | Email           | Пароль      |
|-------|-----------------|------------|
| admin | admin@edu.example | Admin12345 |
| user  | user@edu.example  | User12345  |

Адреса с доменом `.example` зарезервированы под документацию (RFC 2606) и проходят проверку email на бэкенде; вариант `*.local` для демо **не использовать** — библиотека email-validator его отклоняет.

Если вы уже запускали проект со старыми сидами (`@edu.local`), удалите файл `backend/edu_catalog.db` и перезапустите бэкенд — сиды создадутся заново.

## PostgreSQL (Docker)

```bash
make db-up
```

В `backend/.env` задайте:

```env
DATABASE_URL=postgresql+psycopg://app:app@127.0.0.1:5432/edu_catalog
```

Затем снова запустите бэкенд — таблицы создадутся автоматически, сиды выполнятся на пустой БД.

## SQL для УП.11

- `sql/01_schema_postgresql.sql` — DDL под PostgreSQL.
- `sql/01_schema_mysql.sql` — DDL под MySQL (REG.RU и др.).
- `sql/02_sample_queries.sql` — примеры под PostgreSQL.
- `sql/02_sample_queries_mysql.sql` — те же идеи под MySQL.

## Деплой: REG.RU + домен `myproj76.ru`

Пошагово: [docs/deployment-reg-ru.md](docs/deployment-reg-ru.md) — создание MySQL в ISPmanager, строка `DATABASE_URL`, ограничения удалённого доступа, CORS.

## Полезные команды

| Команда              | Действие                |
|----------------------|-------------------------|
| `make preflight`     | Проверки без запуска (backend import + сборка фронта) |
| `make start`         | preflight → API :8000 → smoke → Vite :5173 (один терминал) |
| `make stop`          | освободить порты 8000 и 5173 |
| `make install-backend` | venv + pip зависимости |
| `make install-frontend` | npm install           |
| `make db-bootstrap`  | таблицы + сиды по `backend/.env` (MySQL/Postgres/SQLite) |
| `make dev-backend`   | uvicorn (нужен активный venv) |
| `make dev-frontend`  | Vite dev-сервер         |

## Репозиторий и сдача

Имя репозитория на GitHub: **`edu-institutions-admission-catalog`**. Для сдачи практики: ссылка на развёрнутый стенд (позже), скриншоты страниц, этот репозиторий.

## Структура

```
backend/app/   — FastAPI, модели, роуты, сиды
backend/scripts/ — bootstrap БД для продакшена
frontend/src/  — React SPA
sql/           — скрипты PostgreSQL / MySQL для отчёта
deploy/        — примеры Nginx и systemd для myproj76.ru
docker-compose.yml
```

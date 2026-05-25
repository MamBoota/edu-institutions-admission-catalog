# Каталог образовательных учреждений для поступления

**Дипломный проект (УП.02 / УП.11):** веб-сервис для поиска и сравнения колледжей, техникумов и вузов с отзывами, рейтингами и избранным.

**Стек:** React (Vite) · FastAPI (Python) · SQLite / PostgreSQL / MySQL

## Где открыть

| Среда | Адрес |
|-------|--------|
| **Продакшен** | [https://myproj76.ru/](https://myproj76.ru/) |
| **Локально** | [http://127.0.0.1:5173](http://127.0.0.1:5173) (после `make start`) |
| **API (локально)** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) |
| **Swagger (локально)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |

На продакшене фронт и API работают с одного домена: Nginx отдаёт статику из `frontend/dist` и проксирует `/api` на Uvicorn. Подробности — [docs/deployment-reg-ru.md](docs/deployment-reg-ru.md) и примеры в каталоге `deploy/`.

## Возможности (MVP)

- Регистрация и вход; без авторизации — только `/login`, `/register` и публичный список городов.
- Роли **`user`** и **`admin`** (демо-логины ниже).
- Профиль: ФИО, возраст, город; предпочтения поступления как фильтр каталога.
- Города с **средней оценкой** и **числом отзывов**; список на фронте **обновляется каждые 15 с**.
- Каталог учреждений, карточка, отзывы, избранное.
- Админ: создание учреждения через API/UI.

## Быстрый старт (SQLite, без Docker)

Из **корня репозитория**:

```bash
make install-backend
make install-frontend
make start
```

`make start` выполняет preflight (импорт бэкенда, сборка фронта), поднимает API на `:8000`, проверяет `/api/health` и `/api/public/cities`, затем запускает Vite на `:5173`. Лог бэкенда: `.dev/backend.log`.

Остановка:

```bash
make stop
```

`Ctrl+C` в терминале с `make start` тоже останавливает бэкенд.

При первом запуске создаётся `backend/edu_catalog.db` и **сиды** (города, учреждения, демо-пользователи).

### Демо-аккаунты

| Роль  | Email             | Пароль     |
|-------|-------------------|------------|
| admin | admin@edu.example | Admin12345 |
| user  | user@edu.example  | User12345  |

Адреса `*.example` — зарезервированный домен для документации (RFC 2606). Если ранее использовались сиды с `@edu.local`, удалите `backend/edu_catalog.db` и перезапустите бэкенд.

### Вручную (два терминала)

**Бэкенд:**

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # при необходимости поправьте JWT_SECRET
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Фронт:**

```bash
cd frontend && npm install && npm run dev
```

Vite проксирует `/api` на `http://127.0.0.1:8000`. Если порты заняты — сначала `make stop`.

## PostgreSQL (Docker)

```bash
make db-up
```

В `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://app:app@127.0.0.1:5432/edu_catalog
```

Перезапустите бэкенд — таблицы и сиды создадутся автоматически.

## Продакшен: REG.RU + myproj76.ru

Пошаговая инструкция: [docs/deployment-reg-ru.md](docs/deployment-reg-ru.md)

Кратко:

1. MySQL в ISPmanager → `DATABASE_URL` в `backend/.env`.
2. `make install-backend && make db-bootstrap` на сервере.
3. `npm run build` в `frontend/` → статика в `frontend/dist`.
4. Uvicorn (systemd) + Nginx — примеры: `deploy/nginx-myproj76.conf.example`, `deploy/uvicorn-edu-catalog.service.example`.
5. `CORS_ORIGINS=https://myproj76.ru,https://www.myproj76.ru` в `backend/.env`.

Проверка после деплоя:

```bash
make prod-check
# или: curl -s https://myproj76.ru/api/health  →  {"status":"ok"}
```

Если вместо JSON приходит HTML — Nginx не проксирует `/api`. Вставьте [`deploy/ispmanager-nginx-snippet.conf`](deploy/ispmanager-nginx-snippet.conf) в ISPmanager и убедитесь, что Uvicorn слушает `:8000` (см. [docs/deployment-reg-ru.md](docs/deployment-reg-ru.md)).

## SQL для УП.11

| Файл | Назначение |
|------|------------|
| `sql/01_schema_postgresql.sql` | DDL PostgreSQL |
| `sql/01_schema_mysql.sql` | DDL MySQL (REG.RU) |
| `sql/02_sample_queries.sql` | Примеры запросов (PostgreSQL) |
| `sql/02_sample_queries_mysql.sql` | Примеры запросов (MySQL) |

## Команды

| Команда | Действие |
|---------|----------|
| `make preflight` | Проверки без запуска (import + сборка фронта) |
| `make start` | preflight → API :8000 → smoke → Vite :5173 |
| `make stop` | освободить порты 8000 и 5173 |
| `make install-backend` | venv + pip |
| `make install-frontend` | npm install |
| `make db-bootstrap` | таблицы + сиды по `backend/.env` |
| `make db-up` / `make db-down` | PostgreSQL в Docker |
| `make dev-backend` | uvicorn (нужен активный venv) |
| `make dev-frontend` | Vite dev-сервер |
| `make build` | production-сборка фронта |
| `make prod-check` | проверка https://myproj76.ru/api (с вашего ПК) |

## Структура репозитория

```
backend/app/       — FastAPI: модели, роуты, сиды
backend/scripts/   — bootstrap БД для продакшена
frontend/src/      — React SPA
sql/               — DDL и примеры запросов для отчёта
docs/              — описание проекта, ER/Use Case, деплой
deploy/            — примеры Nginx и systemd для myproj76.ru
scripts/           — preflight, dev-start, dev-stop
docker-compose.yml — PostgreSQL для локальной разработки
```

## Документация

- [Описание проекта](docs/project_description.md)
- [ER-диаграмма](docs/er-diagram-description.md)
- [Деплой на REG.RU](docs/deployment-reg-ru.md)

## Репозиторий

GitHub: **`edu-institutions-admission-catalog`**

Для сдачи: ссылка на [развёрнутый стенд](https://myproj76.ru/), скриншоты страниц, этот репозиторий.

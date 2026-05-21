.PHONY: install-backend install-frontend preflight start stop db-up db-down db-bootstrap dev-backend dev-frontend

install-backend:
	cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

preflight:
	@bash scripts/preflight.sh

# Запуск из корня репозитория: preflight → API → smoke → Vite (остановка Ctrl+C или make stop).
start:
	@bash scripts/dev-start.sh

stop:
	@bash scripts/dev-stop.sh

db-up:
	docker compose up -d db

db-down:
	docker compose down

# Создать таблицы и сиды (пустая БД). Нужен backend/.env с DATABASE_URL.
db-bootstrap:
	cd backend && . .venv/bin/activate && python scripts/bootstrap_db.py

dev-backend:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

dev-frontend:
	cd frontend && npm run dev

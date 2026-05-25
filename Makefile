.PHONY: install-backend install-frontend preflight start stop db-up db-down db-bootstrap dev-backend dev-frontend build prod-check

install-backend:
	@bash scripts/install-backend.sh

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

build:
	@node -e "const m=+process.version.slice(1).split('.')[0]; if(m<18){console.error('\nNode '+process.version+' на сервере — слишком старый для Vite (нужен 18+).\nСоберите фронт на Mac: make install-frontend && make build\nЗатем залейте frontend/dist/ и deploy/api.php через Менеджер файлов.\n');process.exit(1)}"
	cd frontend && (test -d node_modules || npm install) && npm run build

prod-check:
	@bash scripts/prod-check.sh

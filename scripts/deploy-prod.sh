#!/usr/bin/env bash
# Деплой на сервере (SSH на REG.RU / VPS). Запуск из корня репозитория.
#
# Перед первым запуском:
#   1) cp backend/.env.example backend/.env  — заполните DATABASE_URL, JWT_SECRET, CORS_ORIGINS
#   2) export WEB_ROOT=/path/to/site/html   — каталог, откуда Nginx отдаёт myproj76.ru
#
# Пример:
#   export WEB_ROOT=/var/www/u1234567/data/www/myproj76.ru
#   bash scripts/deploy-prod.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WEB_ROOT="${WEB_ROOT:-}"
SERVICE_NAME="${SERVICE_NAME:-edu-catalog-api}"

if [[ -z "$WEB_ROOT" ]]; then
  echo "Укажите WEB_ROOT — каталог статики сайта myproj76.ru в ISPmanager." >&2
  echo "  export WEB_ROOT=/var/www/.../data/www/myproj76.ru" >&2
  echo "  bash scripts/deploy-prod.sh" >&2
  exit 1
fi

if [[ ! -f backend/.env ]]; then
  echo "Нет backend/.env — скопируйте backend/.env.example и заполните DATABASE_URL." >&2
  exit 1
fi

echo "== Backend: venv + зависимости =="
make install-backend

echo "== БД: таблицы + сиды =="
make db-bootstrap

echo "== Frontend: production build =="
make build

echo "== Копирование dist → $WEB_ROOT =="
mkdir -p "$WEB_ROOT"
rsync -a --delete frontend/dist/ "$WEB_ROOT/"

echo "== Перезапуск API ($SERVICE_NAME) =="
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl status "$SERVICE_NAME" --no-pager -l || true
elif command -v systemctl >/dev/null 2>&1; then
  echo "Сервис $SERVICE_NAME не найден. Установите unit из deploy/uvicorn-edu-catalog.service.example" >&2
  echo "  sudo cp deploy/uvicorn-edu-catalog.service.example /etc/systemd/system/${SERVICE_NAME}.service" >&2
  echo "  sudo systemctl daemon-reload && sudo systemctl enable --now $SERVICE_NAME" >&2
else
  echo "systemctl недоступен — запустите Uvicorn вручную:" >&2
  echo "  cd backend && . .venv/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 8000" >&2
fi

echo ""
echo "== Локальная проверка API на сервере =="
if curl -sfS --max-time 5 http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
  curl -sS http://127.0.0.1:8000/api/health
  echo ""
else
  echo "✗ Uvicorn не отвечает на :8000 — проверьте systemd и backend/.env" >&2
  exit 1
fi

echo ""
echo "== Дальше =="
echo "1. В ISPmanager добавьте deploy/ispmanager-nginx-snippet.conf в «Дополнительные директives nginx»"
echo "2. С вашего ПК: make prod-check"

#!/usr/bin/env bash
# Элементарные проверки до запуска dev-стека (вызывается из dev-start.sh и вручную: make preflight).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Backend =="
if [[ ! -d backend/.venv ]]; then
  echo "Нет backend/.venv — выполните: make install-backend" >&2
  exit 1
fi
(
  cd backend
  # shellcheck disable=SC1091
  source .venv/bin/activate
  python -m compileall -q app
  python -c "from app.main import app; print('import ok:', app.title)"
)

echo "== Frontend =="
(
  cd frontend
  if [[ ! -d node_modules ]]; then
    echo "Установка npm-зависимостей…"
    npm install
  fi
  npm run build
)

echo "== Preflight OK =="

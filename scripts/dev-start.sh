#!/usr/bin/env bash
# Preflight → поднять API → дождаться health → smoke API → запустить Vite (foreground).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p .dev

"$ROOT/scripts/preflight.sh"

cleanup() {
  echo ""
  echo "Останавливаю бэкенд на :8000…"
  pids="$(lsof -nP -iTCP:8000 -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    kill $pids 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "== Запуск API (uvicorn) =="
(
  cd backend
  # shellcheck disable=SC1091
  source .venv/bin/activate
  exec uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
) >"$ROOT/.dev/backend.log" 2>&1 &
BACK_PID=$!
echo "$BACK_PID" >"$ROOT/.dev/backend.pid"

echo "Ожидание http://127.0.0.1:8000/api/health …"
ok=0
for _ in $(seq 1 60); do
  if curl -sfS "http://127.0.0.1:8000/api/health" >/dev/null; then
    ok=1
    break
  fi
  sleep 0.25
done
if [[ "$ok" -ne 1 ]]; then
  echo "Бэкенд не поднялся за отведённое время. Хвост лога:" >&2
  tail -40 "$ROOT/.dev/backend.log" >&2 || true
  exit 1
fi

echo "Smoke: /api/public/cities"
curl -sfS "http://127.0.0.1:8000/api/public/cities" | python3 -c "import json,sys; d=json.load(sys.stdin); assert isinstance(d,list); print('городов:', len(d))"

echo "== Запуск фронта (Vite) на http://127.0.0.1:5173 =="
echo "Остановка: в другом терминале \`make stop\` или Ctrl+C (остановит и Vite, и API)."
cd frontend
npm run dev

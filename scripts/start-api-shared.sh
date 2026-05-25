#!/usr/bin/env bash
# Запуск Uvicorn на shared-хостинге (без systemd). Можно вызывать из CRON.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
LOG="${API_LOG:-$HOME/api.log}"
PIDFILE="${API_PIDFILE:-$HOME/api.pid}"

if [[ ! -f "$BACKEND/.env" ]]; then
  echo "Нет $BACKEND/.env" >&2
  exit 1
fi

if [[ -f "$PIDFILE" ]]; then
  old_pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    if curl -sfS --max-time 3 http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
      echo "API уже работает (PID $old_pid)"
      exit 0
    fi
    kill "$old_pid" 2>/dev/null || true
  fi
fi

cd "$BACKEND"
# shellcheck disable=SC1091
source .venv/bin/activate

nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 >>"$LOG" 2>&1 &
echo $! >"$PIDFILE"
sleep 2

if curl -sfS --max-time 5 http://127.0.0.1:8000/api/health >/dev/null; then
  echo "OK: Uvicorn запущен, PID $(cat "$PIDFILE")"
  curl -s http://127.0.0.1:8000/api/health
  echo
else
  echo "Ошибка запуска. Хвост лога:" >&2
  tail -20 "$LOG" >&2 || true
  exit 1
fi

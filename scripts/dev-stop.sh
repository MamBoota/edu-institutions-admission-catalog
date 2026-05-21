#!/usr/bin/env bash
# Останавливает процессы на портах API (8000) и Vite (5173).
set -euo pipefail

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Останавливаю порт $port (PID: $pids)"
    kill $pids 2>/dev/null || true
    sleep 0.3
    pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      echo "Принудительно: $port"
      kill -9 $pids 2>/dev/null || true
    fi
  else
    echo "Порт $port: ничего не слушает"
  fi
}

kill_port 5173
kill_port 8000
echo "Готово."

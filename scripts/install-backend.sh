#!/usr/bin/env bash
# Выбирает Python >= 3.8, обновляет pip, создаёт venv и ставит зависимости.
# На REG.RU shared системный python3 часто 3.8 с древним pip — сначала upgrade pip.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
MIN_MAJOR=3
MIN_MINOR=8

pick_python() {
  local candidates=()
  if [[ -n "${PYTHON:-}" ]]; then
    candidates+=("$PYTHON")
  fi
  local ver
  for ver in 3.13 3.12 3.11 3.10 3.9 3.8; do
    candidates+=("python${ver}")
  done
  candidates+=("python3")

  local p
  for p in /opt/python/*/bin/python3 /usr/local/bin/python3.*; do
    [[ -x "$p" ]] && candidates+=("$p")
  done

  local c major minor
  for c in "${candidates[@]}"; do
    if ! command -v "$c" >/dev/null 2>&1 && [[ ! -x "$c" ]]; then
      continue
    fi
    if ! "$c" -c "import sys; raise SystemExit(0 if sys.version_info >= (${MIN_MAJOR}, ${MIN_MINOR}) else 1)" 2>/dev/null; then
      continue
    fi
    major="$("$c" -c 'import sys; print(sys.version_info.major)')"
    minor="$("$c" -c 'import sys; print(sys.version_info.minor)')"
    echo "$c"
    echo "Используется Python ${major}.${minor}: $c" >&2
    return 0
  done

  echo "Не найден Python >= ${MIN_MAJOR}.${MIN_MINOR}." >&2
  echo "Проверка: python3 --version; which python3.10 python3.11 2>/dev/null" >&2
  exit 1
}

PY="$(pick_python)"
cd "$BACKEND"

rm -rf .venv
"$PY" -m venv .venv

# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

python -c "import fastapi; print('OK: fastapi', fastapi.__version__, 'python', end=' '); import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"

#!/usr/bin/env bash
# Проверка продакшена с вашего ПК: curl https://myproj76.ru/api/...
set -euo pipefail

BASE="${PROD_URL:-https://myproj76.ru}"
FAIL=0

check_json() {
  local path="$1"
  local expect="$2"
  local url="${BASE}${path}"
  echo "→ GET $url"
  local body code ctype
  body="$(curl -fsS --max-time 20 "$url" 2>&1)" && code=200 || code=$?
  if [[ "$code" != "200" ]]; then
    echo "  ✗ HTTP $code"
    echo "$body" | head -5
    FAIL=1
    return
  fi
  ctype="$(curl -sS -o /dev/null -w '%{content_type}' --max-time 20 "$url")"
  if [[ "$ctype" != *"json"* ]]; then
    echo "  ✗ Ожидался JSON, получен Content-Type: $ctype"
    echo "$body" | head -3
    echo "  Подсказка: Nginx не проксирует /api — см. deploy/ispmanager-nginx-snippet.conf"
    FAIL=1
    return
  fi
  if [[ "$body" != *"$expect"* ]]; then
    echo "  ✗ Тело не содержит «$expect»: $body"
    FAIL=1
    return
  fi
  echo "  ✓ OK ($body)"
}

echo "== Проверка $BASE =="
check_json "/api/health" '"status"'
check_json "/api/public/cities" '['

if [[ "$FAIL" -eq 0 ]]; then
  echo "== Всё в порядке =="
else
  echo "== Есть проблемы — см. docs/deployment-reg-ru.md § «Диагностика» =="
  exit 1
fi

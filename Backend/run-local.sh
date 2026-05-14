#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env.local"
FIREBASE_JSON_FILE="$ROOT_DIR/firebase-service-account.json"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

if [[ -z "${JDBC_DATABASE_URL:-}" || -z "${JDBC_DATABASE_USERNAME:-}" ]]; then
  echo "[warn] JDBC_DATABASE_URL / JDBC_DATABASE_USERNAME not set."
  echo "       Copy Backend/.env.local.example to Backend/.env.local and fill DB vars."
  echo "       (Make sure JDBC_DATABASE_URL is quoted if it contains '&'.)"
fi

if [[ -z "${PLATE_RECOGNIZER_TOKEN:-}" ]]; then
  echo "[warn] PLATE_RECOGNIZER_TOKEN is not set. OCR will be disabled."
  echo "       Set it in Backend/.env.local (see Backend/.env.local.example)."
fi

if [[ -f "$FIREBASE_JSON_FILE" ]]; then
  export FIREBASE_SERVICE_ACCOUNT_JSON="$(
    python3 -c 'import json, pathlib; p=pathlib.Path("firebase-service-account.json"); print(json.dumps(json.loads(p.read_text())))'
  )"
else
  echo "[warn] Firebase service account file not found:"
  echo "       $FIREBASE_JSON_FILE"
  echo "       Place your JSON there (ignored by git)."
fi

export PLATE_RECOGNIZER_TOKEN="${PLATE_RECOGNIZER_TOKEN:-}"
export JDBC_DATABASE_URL="${JDBC_DATABASE_URL:-}"
export JDBC_DATABASE_USERNAME="${JDBC_DATABASE_USERNAME:-}"
export JDBC_DATABASE_PASSWORD="${JDBC_DATABASE_PASSWORD:-}"

echo "[ok] Starting backend..."
exec mvn spring-boot:run


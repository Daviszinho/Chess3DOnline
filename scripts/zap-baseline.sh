#!/usr/bin/env bash
set -euo pipefail

PORT="${ZAP_PORT:-4173}"
TARGET_URL="${ZAP_TARGET_URL:-http://127.0.0.1:${PORT}}"
REPORT_DIR="${ZAP_REPORT_DIR:-zap-reports}"
CONTAINER_IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"

mkdir -p "${REPORT_DIR}"

npm run build

if command -v ss >/dev/null 2>&1; then
  if ss -ltn "( sport = :${PORT} )" | grep -q ":${PORT}"; then
    echo "Port ${PORT} is already in use. Stop the existing server first." >&2
    exit 1
  fi
fi

ZAP_PORT="${PORT}" node ./scripts/secure-preview.mjs >/tmp/chess3d-preview.log 2>&1 &
PREVIEW_PID=$!

cleanup() {
  if kill -0 "${PREVIEW_PID}" >/dev/null 2>&1; then
    kill "${PREVIEW_PID}" >/dev/null 2>&1 || true
    wait "${PREVIEW_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

for _ in {1..60}; do
  if curl -fsS "${TARGET_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${TARGET_URL}" >/dev/null 2>&1; then
  echo "Preview server did not become ready at ${TARGET_URL}" >&2
  exit 1
fi

HEADERS="$(curl -sSI "${TARGET_URL}" || true)"
if ! printf '%s' "${HEADERS}" | grep -qi '^Content-Security-Policy:'; then
  echo "Missing Content-Security-Policy header at ${TARGET_URL}" >&2
  echo "${HEADERS}" >&2
  exit 1
fi
if ! printf '%s' "${HEADERS}" | grep -qi '^X-Frame-Options:'; then
  echo "Missing X-Frame-Options header at ${TARGET_URL}" >&2
  echo "${HEADERS}" >&2
  exit 1
fi

# Use host network so ZAP container can reach local preview on Linux.
docker run --rm --network host -v "$(pwd)/${REPORT_DIR}:/zap/wrk:rw" "${CONTAINER_IMAGE}" \
  zap-baseline.py \
  -t "${TARGET_URL}" \
  -I \
  -r zap-report.html \
  -J zap-report.json \
  -w zap-report.md

echo "ZAP reports generated in ${REPORT_DIR}/"

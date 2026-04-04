#!/bin/zsh
set -euo pipefail

PORT=4317
TUNNEL_NAME="${TUNNEL_NAME:-gallery}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "[open-gallery] cloudflared is not installed."
  echo "[open-gallery] Install Cloudflare Tunnel first or use local start commands instead."
  exit 1
fi

cleanup() {
  if [[ -n "${TUNNEL_PID:-}" ]]; then
    kill "${TUNNEL_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "[open-gallery] Building app..."
npm run build

echo "[open-gallery] Starting Cloudflare tunnel: ${TUNNEL_NAME}"
cloudflared tunnel run "${TUNNEL_NAME}" >/tmp/open-gallery-cloudflared.log 2>&1 &
TUNNEL_PID=$!

sleep 2

echo "[open-gallery] Starting app on port ${PORT}"
npm run start -- --hostname 0.0.0.0 --port "${PORT}"

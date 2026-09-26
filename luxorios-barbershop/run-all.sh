#!/bin/bash

set -Eeuo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$BASE_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"

PIDS=()

#####################################
# CLEANUP
#####################################

cleanup() {
  echo ""
  echo "🛑 Stopping all services..."

  for pid in "${PIDS[@]}"; do
    kill -TERM "$pid" 2>/dev/null || true
  done

  wait 2>/dev/null || true
  echo "✅ All services stopped cleanly"
}

trap cleanup INT TERM EXIT

#####################################
# DEPENDENCIES CHECK
#####################################

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ Missing dependency: $1"
    exit 1
  }
}

echo "🔍 Checking dependencies..."
require_cmd node
require_cmd npm
require_cmd cloudflared
require_cmd curl

#####################################
# WAIT FOR HTTP READY (IMPORTANT FIX)
#####################################

wait_for_http() {
  local url=$1
  local retries=30

  echo "⏳ Waiting for $url ..."

  until curl -s "$url" >/dev/null; do
    sleep 0.5
    ((retries--)) || {
      echo "❌ Service not responding: $url"
      exit 1
    }
  done

  echo "✅ Ready: $url"
}

#####################################
# BACKEND
#####################################

start_backend() {
  echo "🚀 Starting Backend..."

  cd "$BASE_DIR/backend"

  NODE_ENV=production node server.js > "$BACKEND_LOG" 2>&1 &
  PIDS+=($!)

  cd "$BASE_DIR"

  wait_for_http "http://localhost:5000"
}

#####################################
# FRONTEND
#####################################

start_frontend() {
  echo "🚀 Starting Frontend..."

  cd "$BASE_DIR/frontend"

  npm run build > /dev/null 2>&1
  npm run preview -- --host 0.0.0.0 > "$FRONTEND_LOG" 2>&1 &

  PIDS+=($!)

  cd "$BASE_DIR"

  wait_for_http "http://localhost:4173"
}

#####################################
# TUNNEL
#####################################

start_tunnel() {
  echo "🌐 Starting Cloudflare Tunnel..."

  cloudflared tunnel \
    --url http://localhost:4173 \
    --protocol http2 \
    > "$TUNNEL_LOG" 2>&1 &

  PIDS+=($!)
}

#####################################
# MAIN
#####################################

echo "===================================="
echo "🚀 STARTING SYSTEM"
echo "===================================="

start_backend
start_frontend
start_tunnel

echo ""
echo "✅ SYSTEM FULLY RUNNING"
echo ""
echo "📊 LOGS:"
echo "Backend : $BACKEND_LOG"
echo "Frontend: $FRONTEND_LOG"
echo "Tunnel  : $TUNNEL_LOG"
echo ""
echo "💡 Press CTRL+C to stop everything"

wait

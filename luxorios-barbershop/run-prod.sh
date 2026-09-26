#!/bin/bash

set -Eeuo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$BASE_DIR/logs"

mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend.log"
BUILD_LOG="$LOG_DIR/frontend-build.log"
DEPLOY_LOG="$LOG_DIR/deploy.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"

PIDS=()
TUNNEL_URL=""

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

trap cleanup INT TERM

#####################################
# DEPENDENCIES
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
require_cmd wrangler
require_cmd curl
require_cmd grep

#####################################
# ENV LOADER
#####################################

load_env() {
  local file=$1
  if [ -f "$file" ]; then
    echo "📦 Loading env: $file"
    set -a
    source "$file"
    set +a
  fi
}

#####################################
# WAIT FOR SERVICE
#####################################

wait_for_http() {
  local url=$1
  local retries=40

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
  load_env "$BASE_DIR/backend/.env"

  NODE_ENV=production node server.js > "$BACKEND_LOG" 2>&1 &
  PIDS+=($!)

  cd "$BASE_DIR"
  wait_for_http "http://localhost:5000"
}

#####################################
# TUNNEL
#####################################

start_tunnel() {
  echo "🌐 Starting Cloudflare Tunnel..."

  cloudflared tunnel \
    --url http://localhost:5000 \
    --protocol http2 \
    > "$TUNNEL_LOG" 2>&1 &

  PIDS+=($!)

  echo "⏳ Waiting for tunnel URL..."

  for i in {1..25}; do
    sleep 1

    TUNNEL_URL=$(grep -o 'https://[-a-zA-Z0-9]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1 || true)

    if [ -n "$TUNNEL_URL" ]; then
      break
    fi
  done

  if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Failed to detect tunnel URL"
    exit 1
  fi

  echo "🌐 Tunnel URL:"
  echo "👉 $TUNNEL_URL"
}

#####################################
# UPDATE ENV
#####################################

update_env_with_tunnel() {
  echo "✏️ Updating frontend .env with new tunnel URL..."

  NEW_API_URL="${TUNNEL_URL}/api"

  sed -i "s|^VITE_API_URL=.*|VITE_API_URL=${NEW_API_URL}|" "$BASE_DIR/frontend/.env"

  echo "✅ Updated .env:"
  grep VITE_API_URL "$BASE_DIR/frontend/.env"
}

#####################################
# FRONTEND BUILD
#####################################

build_frontend() {
  echo "📦 Building Frontend..."

  cd "$BASE_DIR/frontend"
  load_env "$BASE_DIR/frontend/.env"

  if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
  else
    echo "✅ Dependencies already installed"
  fi

  npm run build | tee "$BUILD_LOG"

  cd "$BASE_DIR"
}

#####################################
# DEPLOY
#####################################

deploy_frontend() {
  echo "🚀 Deploying to Cloudflare Pages..."

  cd "$BASE_DIR/frontend"

  wrangler pages deploy dist \
    --project-name "${PAGES_PROJECT:-abo-rabe3}" \
    | tee "$DEPLOY_LOG"

  cd "$BASE_DIR"

  echo "✅ Deployment complete"
}

#####################################
# MAIN FLOW
#####################################

echo "===================================="
echo "🚀 STARTING PRODUCTION SYSTEM"
echo "===================================="

start_backend
start_tunnel
update_env_with_tunnel
build_frontend
deploy_frontend

echo ""
echo "✅ SYSTEM RUNNING"
echo ""
echo "🌐 ACTIVE API URL:"
echo "👉 ${TUNNEL_URL}/api"
echo ""
echo "📊 LOGS:"
echo "Backend : $BACKEND_LOG"
echo "Build   : $BUILD_LOG"
echo "Deploy  : $DEPLOY_LOG"
echo "Tunnel  : $TUNNEL_LOG"
echo ""
echo "💡 Press CTRL+C to stop everything"

wait

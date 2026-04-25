#!/usr/bin/env bash
set -euo pipefail

# Redeploy script for systemd-managed Flask + Nginx stack.
# Default paths/services can be overridden via environment variables.
PROJECT_ROOT="${PROJECT_ROOT:-/home/davidrcf525/IERG4210}"
BACKEND_DIR="${BACKEND_DIR:-$PROJECT_ROOT/server}"
VENV_PIP="${VENV_PIP:-$BACKEND_DIR/venv/bin/pip}"
REQUIREMENTS_FILE="${REQUIREMENTS_FILE:-$BACKEND_DIR/requirements.txt}"
FLASK_SERVICE="${FLASK_SERVICE:-flask_app}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found." >&2
    exit 1
  fi
}

require_path() {
  if [[ ! -e "$1" ]]; then
    echo "Error: required path not found: $1" >&2
    exit 1
  fi
}

require_cmd npm
require_cmd sudo
require_path "$PROJECT_ROOT"
require_path "$BACKEND_DIR"
require_path "$VENV_PIP"
require_path "$REQUIREMENTS_FILE"

log "Starting redeploy in $PROJECT_ROOT"

cd "$PROJECT_ROOT"

log "Installing frontend dependencies"
npm ci

log "Building frontend assets"
npm run build

log "Installing backend Python dependencies"
"$VENV_PIP" install -r "$REQUIREMENTS_FILE"

log "Validating nginx configuration"
sudo nginx -t

log "Restarting service: $FLASK_SERVICE"
sudo systemctl restart "$FLASK_SERVICE"

log "Reloading nginx"
sudo systemctl reload nginx

log "Redeploy completed successfully"

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

source "$SCRIPT_DIR/scripts/dev-server-common.sh"

PORT="$(resolve_dev_port "$SCRIPT_DIR")"

require_command npm "npm was not found. Please install Node.js first."
require_command lsof "lsof was not found. Cannot safely check whether port $PORT is already in use."
exit_if_dev_port_busy "$PORT"

echo "Starting backend with Android dev URL sync..."
npm run dev:android

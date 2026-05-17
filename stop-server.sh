#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

source "$SCRIPT_DIR/scripts/dev-server-common.sh"

PORT="$(resolve_dev_port "$SCRIPT_DIR")"

require_command lsof "lsof was not found. Cannot find the backend dev server process."

TARGET_PIDS=()
SKIPPED_PIDS=()

append_unique_target_pid() {
  local candidate="$1"
  local existing

  [[ -n "$candidate" ]] || return 0

  for existing in "${TARGET_PIDS[@]}"; do
    [[ "$existing" == "$candidate" ]] && return 0
  done

  TARGET_PIDS+=("$candidate")
}

is_pid_running() {
  local pid="$1"

  lsof -nP -a -p "$pid" -d cwd >/dev/null 2>&1
}

is_project_backend_listener() {
  local pid="$1"
  local cwd
  local command_text

  cwd="$(process_cwd "$pid")"
  if is_same_or_child_path "$cwd" "$SCRIPT_DIR"; then
    return 0
  fi

  command_text="$(process_command "$pid")"
  [[ "$command_text" == *node* && "$command_text" == *server.js* ]]
}

is_project_dev_parent() {
  local pid="$1"
  local cwd
  local command_text

  cwd="$(process_cwd "$pid")"
  command_text="$(process_command "$pid")"

  if ! is_same_or_child_path "$cwd" "$SCRIPT_DIR"; then
    return 1
  fi

  [[ "$command_text" == "node" || "$command_text" == "npm" || "$command_text" == "nodemon" ]]
}

collect_dev_parent_pids() {
  local pid="$1"
  local parent_pid

  parent_pid="$(process_parent_pid "$pid")"

  while [[ -n "$parent_pid" && "$parent_pid" != "0" && "$parent_pid" != "1" ]]; do
    if ! is_project_dev_parent "$parent_pid"; then
      break
    fi

    append_unique_target_pid "$parent_pid"
    parent_pid="$(process_parent_pid "$parent_pid")"
  done
}

listener_pids="$(list_port_listener_pids "$PORT" || true)"

if [[ -z "$listener_pids" ]]; then
  echo "No backend dev server is listening on port $PORT."
  exit 0
fi

while IFS= read -r pid; do
  [[ -n "$pid" ]] || continue

  if is_project_backend_listener "$pid"; then
    collect_dev_parent_pids "$pid"
    append_unique_target_pid "$pid"
  else
    SKIPPED_PIDS+=("$pid")
  fi
done <<< "$listener_pids"

if [[ "${#TARGET_PIDS[@]}" -eq 0 ]]; then
  echo "Port $PORT is in use, but no matching task-backend dev server process was found."
  print_port_listeners "$PORT"
  exit 1
fi

echo "Stopping backend dev server on port $PORT..."
for pid in "${TARGET_PIDS[@]}"; do
  echo "  stopping PID $pid: $(process_command "$pid")"
done

kill -TERM "${TARGET_PIDS[@]}" 2>/dev/null || true

remaining_pids=()
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  remaining_pids=()

  for pid in "${TARGET_PIDS[@]}"; do
    if is_pid_running "$pid"; then
      remaining_pids+=("$pid")
    fi
  done

  [[ "${#remaining_pids[@]}" -eq 0 ]] && break
  sleep 0.25
done

if [[ "${#remaining_pids[@]}" -gt 0 ]]; then
  echo "Some processes did not stop after SIGTERM; forcing stop..."
  kill -KILL "${remaining_pids[@]}" 2>/dev/null || true
fi

if has_port_listener "$PORT"; then
  echo "Port $PORT is still in use:"
  print_port_listeners "$PORT"
  exit 1
fi

if [[ "${#SKIPPED_PIDS[@]}" -gt 0 ]]; then
  echo "Skipped unrelated listener PID(s): ${SKIPPED_PIDS[*]}"
fi

echo "Backend dev server stopped."

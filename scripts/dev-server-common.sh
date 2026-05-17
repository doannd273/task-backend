#!/usr/bin/env bash

DEFAULT_DEV_PORT=3000

read_env_value() {
  local env_file="$1"
  local key="$2"
  local line
  local value

  [[ -f "$env_file" ]] || return 1

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue

    case "$line" in
      "$key"=*)
        value="${line#*=}"
        ;;
      *)
        if [[ "$line" =~ ^${key}[[:space:]]*= ]]; then
          value="${line#*=}"
        else
          continue
        fi
        ;;
    esac

    value="${value%%#*}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    fi

    if [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    printf '%s\n' "$value"
    return 0
  done < "$env_file"

  return 1
}

resolve_dev_port() {
  local project_dir="$1"
  local port="${PORT:-}"

  if [[ -z "$port" ]]; then
    port="$(read_env_value "$project_dir/.env" PORT || true)"
  fi

  printf '%s\n' "${port:-$DEFAULT_DEV_PORT}"
}

require_command() {
  local command_name="$1"
  local message="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$message"
    exit 1
  fi
}

list_port_listener_pids() {
  local port="$1"

  lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u
}

has_port_listener() {
  local port="$1"

  [[ -n "$(list_port_listener_pids "$port")" ]]
}

process_command() {
  local pid="$1"
  local command_text

  command_text="$(lsof -nP -a -p "$pid" -d cwd -Fpc 2>/dev/null | awk '/^c/ { print substr($0, 2); exit }' || true)"
  printf '%s\n' "$command_text"
}

process_parent_pid() {
  local pid="$1"
  local parent_pid

  parent_pid="$(lsof -nP -a -p "$pid" -d cwd -FpR 2>/dev/null | awk '/^R/ { print substr($0, 2); exit }' || true)"
  printf '%s\n' "$parent_pid"
}

process_cwd() {
  local pid="$1"
  local cwd

  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^n/ { print substr($0, 2); exit }' || true)"
  printf '%s\n' "$cwd"
}

is_same_or_child_path() {
  local path_value="$1"
  local root_path="$2"

  case "$path_value" in
    "$root_path"|"$root_path"/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

print_port_listeners() {
  local port="$1"
  local pid
  local command_text

  for pid in $(list_port_listener_pids "$port"); do
    command_text="$(process_command "$pid")"
    echo "  PID $pid: ${command_text:-unknown command}"
  done
}

exit_if_dev_port_busy() {
  local port="$1"

  if has_port_listener "$port"; then
    echo "Backend dev port $port is already in use. Not starting another instance."
    print_port_listeners "$port"
    echo "Run ./stop-server.sh if you want to stop the existing dev server."
    exit 0
  fi
}

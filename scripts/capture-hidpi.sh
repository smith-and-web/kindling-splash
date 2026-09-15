#!/usr/bin/env bash
# Run native screenshots in a temporary 2x mode, restoring on exit or interruption.
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
capture_tmp="$(mktemp -d "${TMPDIR:-/tmp}/kindling-hidpi.XXXXXX")"
capture_pid=""

cleanup() {
  local result=$?
  trap - EXIT
  trap '' INT TERM HUP
  if [[ -n "$capture_pid" ]]; then
    kill -TERM "$capture_pid" 2>/dev/null || true
    wait "$capture_pid" 2>/dev/null || true
  fi
  if [[ -f "$capture_tmp/display.json" ]]; then
    if ! "$capture_tmp/display" restore "$capture_tmp/display.json"; then
      printf 'Display recovery files retained at: %s\n' "$capture_tmp" >&2
      printf 'Restore manually: bash %q --restore %q\n' "$repo_dir/scripts/capture-hidpi.sh" "$capture_tmp/display.json" >&2
      exit 1
    fi
  fi
  rm -rf "$capture_tmp"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

xcrun swiftc "$repo_dir/scripts/capture-display.swift" -o "$capture_tmp/display"
if [[ "${1:-}" == "--dry-run" ]]; then
  "$capture_tmp/display" inspect
  exit
fi
if [[ "${1:-}" == "--restore" ]]; then
  "$capture_tmp/display" restore "${2:?Supply the saved display.json path}"
  exit
fi

printf 'Recovery file (if force-quit): %s/display.json\n' "$capture_tmp"
"$capture_tmp/display" begin "$capture_tmp/display.json"
sleep 2
cd "$repo_dir"
node scripts/capture-screenshots.mjs "$@" &
capture_pid=$!
wait "$capture_pid"
capture_pid=""

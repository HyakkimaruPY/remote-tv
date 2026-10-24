#!/bin/sh
set -u

ROOT="${PHILCO_ROOT:-}"
CUSTOMER="${ROOT}/Customer"
BIN="${CUSTOMER}/remote-tv/philco-localhost-mipsle-beta651"
LOCK="${ROOT}/dev/shm/remote-tv-beta651.lock"

[ -x "$BIN" ] || exit 0
mkdir -p "${ROOT}/dev/shm" 2>/dev/null || true
if ! mkdir "$LOCK" 2>/dev/null; then
    exit 0
fi
printf '%s\n' "$$" > "$LOCK/pid"
child=""
cleanup() {
    trap - EXIT INT TERM HUP
    if [ -n "$child" ]; then
        kill "$child" 2>/dev/null || true
        wait "$child" 2>/dev/null || true
    fi
    rm -f "$LOCK/pid"
    rmdir "$LOCK" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' INT TERM HUP

attempt=0
while [ -x "$BIN" ]; do
    "$BIN" >/dev/null 2>&1 &
    child=$!
    wait "$child"
    rc=$?
    child=""
    attempt=$((attempt + 1))
    [ "$attempt" -lt 60 ] || exit "$rc"
    sleep 5 &
    child=$!
    wait "$child"
    child=""
done
exit 0

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
cleanup() { rmdir "$LOCK" 2>/dev/null || true; }
trap cleanup EXIT INT TERM HUP

attempt=0
while [ -x "$BIN" ]; do
    "$BIN" >/dev/null 2>&1
    rc=$?
    attempt=$((attempt + 1))
    [ "$attempt" -lt 60 ] || exit "$rc"
    sleep 5
done
exit 0

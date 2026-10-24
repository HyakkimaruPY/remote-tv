#!/bin/sh
set -eu

ROOT="${PHILCO_ROOT:-}"
CUSTOMER="${ROOT}/Customer"
TARGET="${CUSTOMER}/remote-tv"
SETUP="${CUSTOMER}/setup.sh"
BIN="$TARGET/philco-localhost-mipsle-beta651"
BEGIN="# REMOTE_TV_BETA651_BEGIN"
END="# REMOTE_TV_BETA651_END"

for p in "${ROOT}"/proc/[0-9]*; do
    [ -r "$p/cmdline" ] || continue
    if tr '\000' ' ' < "$p/cmdline" 2>/dev/null | grep -F "$BIN" >/dev/null 2>&1; then
        kill "${p##*/}" 2>/dev/null || true
    fi
done

if [ -f "$SETUP" ]; then
    tmp="$SETUP.remote-tv.$$"
    sed "/^$BEGIN$/,/^$END$/d" "$SETUP" > "$tmp"
    chmod 755 "$tmp"
    mv "$tmp" "$SETUP"
fi

rm -f "$TARGET/philco-localhost-mipsle-beta651" "$TARGET/start-beta651.sh"
rm -rf "${ROOT}/dev/shm/remote-tv-beta651.lock" 2>/dev/null || true

echo "Remote TV companion beta651 removido; backup histórico preservado em $TARGET"

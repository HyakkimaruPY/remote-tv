#!/bin/sh
set -eu

ROOT="${PHILCO_ROOT:-}"
CUSTOMER="${ROOT}/Customer"
TARGET="${CUSTOMER}/remote-tv"
SETUP="${CUSTOMER}/setup.sh"
BIN="$TARGET/philco-localhost-mipsle-beta651"
BEGIN="# REMOTE_TV_BETA651_BEGIN"
END="# REMOTE_TV_BETA651_END"
LOCK="${ROOT}/dev/shm/remote-tv-beta651.lock"
PROC="${ROOT}/proc"

# Remove the launch target before stopping processes so an older supervisor
# cannot restart the companion in the middle of uninstall.
rm -f "$BIN" "$TARGET/start-beta651.sh"

if [ -r "$LOCK/pid" ]; then
    supervisor=$(cat "$LOCK/pid")
    case "$supervisor" in
        ''|*[!0-9]*) ;;
        *)
            if [ -r "$PROC/$supervisor/cmdline" ] &&
                tr '\000' '\n' < "$PROC/$supervisor/cmdline" | grep -Fx "$TARGET/start-beta651.sh" >/dev/null 2>&1; then
                kill "$supervisor" 2>/dev/null || true
            fi
            ;;
    esac
fi

for p in "$PROC"/[0-9]*; do
    [ -r "$p/cmdline" ] || continue
    if tr '\000' '\n' < "$p/cmdline" 2>/dev/null | grep -Fx "$BIN" >/dev/null 2>&1; then
        kill "${p##*/}" 2>/dev/null || true
    fi
done

if [ -f "$SETUP" ]; then
    tmp="$SETUP.remote-tv.$$"
    sed "/^$BEGIN$/,/^$END$/d" "$SETUP" > "$tmp"
    chmod 755 "$tmp"
    mv "$tmp" "$SETUP"
fi

# The supervisor owns its lock and releases it after reaping the child.

echo "Remote TV companion beta651 removido; backup histórico preservado em $TARGET"

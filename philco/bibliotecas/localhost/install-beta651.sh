#!/bin/sh
set -eu

ROOT="${PHILCO_ROOT:-}"
CUSTOMER="${ROOT}/Customer"
TARGET="${CUSTOMER}/remote-tv"
SETUP="${CUSTOMER}/setup.sh"
DIR=$(CDPATH= cd "$(dirname "$0")" 2>/dev/null && pwd)
BIN_SRC="$DIR/philco-localhost-mipsle-beta651"
START_SRC="$DIR/start-beta651.sh"
BEGIN="# REMOTE_TV_BETA651_BEGIN"
END="# REMOTE_TV_BETA651_END"

[ -f "$BIN_SRC" ] || { echo "ERRO: companion ausente: $BIN_SRC" >&2; exit 2; }
[ -f "$START_SRC" ] || { echo "ERRO: start-beta651.sh ausente" >&2; exit 2; }
mkdir -p "$TARGET"

if [ -f "$DIR/philco-localhost-mipsle-beta651.sha256" ] && command -v sha256sum >/dev/null 2>&1; then
    expected=$(awk 'NR==1{print $1}' "$DIR/philco-localhost-mipsle-beta651.sha256")
    actual=$(sha256sum "$BIN_SRC" | awk '{print $1}')
    [ "$expected" = "$actual" ] || { echo "ERRO: SHA-256 do companion divergiu" >&2; exit 3; }
fi

cp "$BIN_SRC" "$TARGET/philco-localhost-mipsle-beta651.new"
chmod 755 "$TARGET/philco-localhost-mipsle-beta651.new"
mv "$TARGET/philco-localhost-mipsle-beta651.new" "$TARGET/philco-localhost-mipsle-beta651"
cp "$START_SRC" "$TARGET/start-beta651.sh.new"
chmod 755 "$TARGET/start-beta651.sh.new"
mv "$TARGET/start-beta651.sh.new" "$TARGET/start-beta651.sh"

if [ -f "$SETUP" ] && [ ! -f "$TARGET/setup.sh.before-beta651" ]; then
    cp "$SETUP" "$TARGET/setup.sh.before-beta651"
fi

tmp="$SETUP.remote-tv.$$"
if [ -f "$SETUP" ]; then
    sed "/^$BEGIN$/,/^$END$/d" "$SETUP" > "$tmp"
else
    printf '%s\n' '#!/bin/sh' > "$tmp"
fi
printf '\n%s\n' "$BEGIN" >> "$tmp"
printf '%s\n' 'if [ -x /Customer/remote-tv/start-beta651.sh ]; then' >> "$tmp"
printf '%s\n' '    /Customer/remote-tv/start-beta651.sh >/dev/null 2>&1 &' >> "$tmp"
printf '%s\n' 'fi' >> "$tmp"
printf '%s\n' "$END" >> "$tmp"
chmod 755 "$tmp"
mv "$tmp" "$SETUP"

if [ "${PHILCO_INSTALL_NO_START:-0}" != "1" ]; then
    "$TARGET/start-beta651.sh" >/dev/null 2>&1 &
fi

echo "Remote TV companion beta651 instalado em $TARGET"

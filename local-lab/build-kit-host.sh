#!/bin/sh
set -eu
: "${KIT_ROOT:?Set KIT_ROOT to a checkout of your private philco-estudos repository}"
HOST_DIR="${PHILCO_HOST_DIR:-/tmp/philco-kit-host}"
mkdir -p "$HOST_DIR"
cp "$KIT_ROOT/builds/v7.2/src/hlsbridge_v7_2.go" "$KIT_ROOT/builds/v7.2/src/hlsbridge_v7_2_test.go" "$HOST_DIR/"
# Host-only CA bundle: this is NOT a byte-identical firmware rebuild.
cp /etc/ssl/certs/ca-certificates.crt "$HOST_DIR/cacert.pem"
cd "$HOST_DIR"
GO111MODULE=off go test -v
GO111MODULE=off go build -o "$HOST_DIR/helper" hlsbridge_v7_2.go

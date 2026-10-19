#!/bin/sh
set -eu
cd "$(dirname "$0")"
mkdir -p media results
ffmpeg -hide_banner -loglevel error -y -f lavfi -i testsrc2=size=640x360:rate=24 -t 6 -c:v libvpx -b:v 450k -an media/channel.webm
ffmpeg -hide_banner -loglevel error -y -f lavfi -i testsrc2=size=1280x720:rate=25 -t 6 -c:v libx264 -preset ultrafast -pix_fmt yuv420p -an -f mpegts media/segment.ts

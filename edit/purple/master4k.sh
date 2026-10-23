#!/usr/bin/env bash
# 3840x2160 HEVC master in batches (4K graphics frames are too big to keep all at once).
# usage: master4k.sh <source.mp4> <mix.wav> <work_dir> <out.mp4>
set -euo pipefail
SRC=$1; MIX=$2; WORK=$3; OUT=$4
HERE=$(cd "$(dirname "$0")" && pwd)
N=$(python3 -c "import json;print(len(json.load(open('$HERE/timeline.json'))))")
STEP=1480
mkdir -p "$WORK/chunks"
for ((a=0; a<N; a+=STEP)); do
  b=$(( a+STEP < N ? a+STEP : N ))
  if ls "$WORK/chunks"/chunks_$(printf %06d $a).txt >/dev/null 2>&1; then continue; fi
  rm -rf "$WORK/g"; mkdir -p "$WORK/g"
  node "$HERE/scenes/render.js" "$WORK/g" 4 $a $((b-1)) --dsf 2 | tail -1
  OUT_SCALE=2 python3 "$HERE/composite.py" "$SRC" "$WORK/g" "$WORK/chunks" 4 $a $b | tail -1
  echo "batch $a-$b done $(date +%T)"
done
rm -rf "$WORK/g"
ls "$WORK/chunks"/chunk_*.mp4 | sort | sed "s|.*/|file '|; s|$|'|" > "$WORK/chunks/all.txt"
ffmpeg -v error -y -f concat -i "$WORK/chunks/all.txt" -i "$MIX" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -movflags +faststart -shortest "$OUT"
ls -la "$OUT"

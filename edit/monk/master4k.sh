#!/usr/bin/env bash
# 3840x2160 HEVC master in resumable batches.
# usage: master4k.sh <hg_dir> <broll_dir> <mix.wav> <work_dir> <out.mp4>
set -euo pipefail
HG=$1; BR=$2; MIX=$3; WORK=$4; OUT=$5
HERE=$(cd "$(dirname "$0")" && pwd)
N=$(python3 -c "import json;print(json.load(open('$HERE/plan.json'))['frames'])")
STEP=1500
mkdir -p "$WORK/chunks"
for ((a=0; a<N; a+=STEP)); do
  b=$(( a+STEP < N ? a+STEP : N ))
  if [ -f "$WORK/chunks/done_$a" ]; then continue; fi
  rm -rf "$WORK/g"; mkdir -p "$WORK/g"
  node "$HERE/scenes/render.js" "$WORK/g" 4 $a $((b-1)) --dsf 2 | tail -1
  OUT_SCALE=2 python3 "$HERE/composite.py" "$HG" "$BR" "$WORK/g" "$WORK/chunks" 4 $a $b | tail -1
  touch "$WORK/chunks/done_$a"
  echo "batch $a-$b done $(date +%T)"
done
rm -rf "$WORK/g"
ls "$WORK/chunks"/chunk_*.mp4 | sort | sed "s|.*/|file '|; s|$|'|" > "$WORK/chunks/all.txt"
ffmpeg -v error -y -f concat -i "$WORK/chunks/all.txt" -i "$MIX" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart -shortest "$OUT"
ls -la "$OUT"

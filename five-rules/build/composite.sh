#!/bin/bash
# Render graphics for [t0,t1) and composite over the presenter base -> work/comp/part_N.mp4
set -e; cd "$(dirname "$0")/.."; N=$1; T0=$2; T1=$3; mkdir -p work/comp
node build/render.js pipe $T0 $T1 25 2> work/comp/render_$N.log | \
ffmpeg -v error -y -ss $T0 -t $(echo "$T1 - $T0" | bc) -i work/base.mp4 -f image2pipe -framerate 25 -c:v png -i - \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -r 25 \
  -c:v libx264 -preset medium -crf 17 work/comp/part_$N.mp4
echo "part $N done"

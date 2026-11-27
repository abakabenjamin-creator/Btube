#!/bin/bash
# part N of the 4K composite: graphics drawn natively at 4K over the Lanczos-upscaled base
set -e; cd "$(dirname "$0")/.."; N=$1; T0=$2; T1=$3; mkdir -p work/comp4k
SCALE=2 node build/render.js pipe $T0 $T1 25 2> work/comp4k/render_$N.log | \
ffmpeg -v error -y -ss $T0 -t $(python3 -c "print($T1-$T0)") -i work/base.mp4 -f image2pipe -framerate 25 -c:v png -i - \
  -filter_complex "[0:v]scale=3840:2160:flags=lanczos,unsharp=5:5:0.5:5:5:0[b];[b][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -r 25 \
  -c:v libx264 -preset veryfast -crf 16 work/comp4k/part_$N.mp4

#!/bin/bash
# 4K composite: graphics drawn natively at 3840x2160 over the Lanczos-upscaled base; mix at -14 LUFS; H.264 high quality
set -e; cd "$(dirname "$0")/.."; D=$(python3 -c "import json;print(json.load(open('build/scenes.json'))['duration'])")
SCALE=2 node build/render.js pipe 0 $D 25 2> work/render.log | \
ffmpeg -v error -y -i work/base.mp4 -f image2pipe -framerate 25 -c:v png -i - \
  -filter_complex "[0:v]scale=3840:2160:flags=lanczos,unsharp=5:5:0.5:5:5:0[b];[b][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -r 25 \
  -c:v libx264 -preset slow -crf 16 work/video4k.mp4
M=$(ffmpeg -nostats -i work/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
get(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i work/video4k.mp4 -i work/mix.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -movflags +faststart -t $D out/The_River_4K.mp4
ls -la out/The_River_4K.mp4

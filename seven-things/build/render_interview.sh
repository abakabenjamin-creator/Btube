#!/bin/sh
# Two-camera interview edit: src/angle.mp4 (looking screen-right) and its mirror (looking screen-left),
# cutting angles at each tip number. Same captions and music bed as render.sh.
cd "$(dirname "$0")/.." && mkdir -p out
# Cut points (s): just before each "#N" pop, from build/words.json.
CUTS="4.6 12.52 17.94 22.7 25.98 35.08 37.6 41.1"
EXPR="0"
i=0
for c in $CUTS; do i=$((i+1)); EXPR="$EXPR+gte(t\,$c)"; done
# Even segment count -> right-facing angle, odd -> mirrored (left-facing).
ffmpeg -y -i src/angle.mp4 -i src/music.wav -filter_complex "\
[0:v]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,setsar=1,split=2[r][l0];\
[l0]hflip[l];\
[r][l]blend=all_expr='if(mod(floor($EXPR)\,2)\,B\,A)',ass=build/captions.ass,format=yuv420p[v];\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[voice][key];\
[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:45.96,volume=-17dB,afade=t=in:d=0.8,afade=t=out:st=43.5:d=2.4[m];\
[m][key]sidechaincompress=threshold=0.04:ratio=4:attack=20:release=350[duck];\
[voice][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
-map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 18 -profile:v high -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$@" out/Seven_Small_Things_interview.mp4

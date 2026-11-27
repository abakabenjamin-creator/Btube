#!/bin/bash
# Join rendered parts, add the mix normalised to -14 LUFS / -1 dBTP -> out/Five_Rules_of_Money_1080p.mp4
set -e; cd "$(dirname "$0")/.."; mkdir -p out
printf "file '%s'\n" "$PWD/work/comp/part_0.mp4" "$PWD/work/comp/part_1.mp4" "$PWD/work/comp/part_2.mp4" > work/comp/list.txt
ffmpeg -v error -y -f concat -safe 0 -i work/comp/list.txt -c copy work/comp/video.mp4
M=$(ffmpeg -nostats -i work/mix/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
get(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i work/comp/video.mp4 -i work/mix/mix.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 256k -shortest -movflags +faststart out/Five_Rules_of_Money_1080p.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact out/Five_Rules_of_Money_1080p.mp4
ffmpeg -nostats -i out/Five_Rules_of_Money_1080p.mp4 -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2

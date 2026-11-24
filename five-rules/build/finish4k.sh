#!/bin/bash
# Join 4K parts, mix normalised to -14 LUFS, final HEVC (hvc1) 2-pass sized to fit a 480 MB upload
set -e; cd "$(dirname "$0")/.."; mkdir -p out
printf "file '%s'\n" "$PWD/work/comp4k/part_0.mp4" "$PWD/work/comp4k/part_1.mp4" "$PWD/work/comp4k/part_2.mp4" > work/comp4k/list.txt
ffmpeg -v error -y -f concat -safe 0 -i work/comp4k/list.txt -c copy work/comp4k/video.mp4
M=$(ffmpeg -nostats -i work/mix/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
get(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i work/mix/mix.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" -c:a aac -b:a 192k work/comp4k/audio.m4a
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 work/comp4k/video.mp4)
VB=$(python3 -c "print(int((480*8*1024*1024/$DUR - 200000)/1000))")   # kbit/s for video
echo "video bitrate ${VB}k"
cd work/comp4k
ffmpeg -v error -y -i video.mp4 -c:v libx265 -preset fast -b:v ${VB}k -x265-params pass=1:log-level=error -an -f null /dev/null
ffmpeg -v error -y -i video.mp4 -i audio.m4a -map 0:v -map 1:a -c:v libx265 -preset fast -b:v ${VB}k -x265-params pass=2:log-level=error -tag:v hvc1 -c:a copy -movflags +faststart ../../out/Five_Rules_of_Money_4K.mp4
cd ../..; ls -la out/Five_Rules_of_Money_4K.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact out/Five_Rules_of_Money_4K.mp4

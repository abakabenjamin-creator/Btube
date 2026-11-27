#!/bin/bash
# join parts, -14 LUFS mix; 4K HEVC sized to ~MB, plus a 1080p H.264 copy
set -e; cd "$(dirname "$0")/.."; mkdir -p out; MB=${MB:-290}
printf "file '%s'\n" $PWD/work/comp4k/part_{0,1,2}.mp4 > work/comp4k/list.txt
ffmpeg -v error -y -f concat -safe 0 -i work/comp4k/list.txt -c copy work/comp4k/video.mp4
M=$(ffmpeg -nostats -i work/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
get(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i work/mix.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" -c:a aac -b:a 192k work/comp4k/audio.m4a
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 work/comp4k/video.mp4)
VB=$(python3 -c "print(int(($MB*8*1024*1024/$DUR-200000)/1000))")
cd work/comp4k
ffmpeg -v error -y -i video.mp4 -c:v libx265 -preset fast -b:v ${VB}k -x265-params pass=1:log-level=error -an -f null /dev/null
ffmpeg -v error -y -i video.mp4 -i audio.m4a -map 0:v -map 1:a -c:v libx265 -preset fast -b:v ${VB}k -x265-params pass=2:log-level=error -tag:v hvc1 -c:a copy -movflags +faststart -shortest ../../out/Simon_and_Solomon_4K.mp4
ffmpeg -v error -y -i video.mp4 -i audio.m4a -map 0:v -map 1:a -vf scale=1920:1080:flags=lanczos -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart -shortest ../../out/Simon_and_Solomon_1080p.mp4
cd ../..; ls -la out

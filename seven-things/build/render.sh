#!/bin/sh
cd "$(dirname "$0")/.." && mkdir -p out && ffmpeg -y -i src/a.mp4 -i src/music.wav -filter_complex "\
[0:v]scale=1080:1920:flags=lanczos,ass=build/captions.ass,format=yuv420p[v];\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[voice][key];\
[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:45.96,volume=-17dB,afade=t=in:d=0.8,afade=t=out:st=43.5:d=2.4[m];\
[m][key]sidechaincompress=threshold=0.04:ratio=4:attack=20:release=350[duck];\
[voice][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
-map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 18 -profile:v high -c:a aac -b:a 256k -ar 48000 -movflags +faststart out/Seven_Small_Things_captioned.mp4

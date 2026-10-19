#!/usr/bin/env bash
# Background music bed: loop assets/music/bed.wav to the voice length with crossfaded seams, fade in/out → out/music.wav
set -euo pipefail
cd "$(dirname "$0")/.."
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/voice.wav)
ffmpeg -v error -y -i assets/music/bed.wav -i assets/music/bed.wav -i assets/music/bed.wav -i assets/music/bed.wav -filter_complex "
 [0][1]acrossfade=d=4:c1=tri:c2=tri[a];[a][2]acrossfade=d=4:c1=tri:c2=tri[b];[b][3]acrossfade=d=4:c1=tri:c2=tri,
 atrim=0:$DUR,afade=t=in:d=2.5,afade=t=out:st=$(python3 -c "print($DUR-5)"):d=5,aresample=44100[m]" -map "[m]" out/music.wav
echo "music bed ok ($DUR s)"

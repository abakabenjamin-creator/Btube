#!/usr/bin/env bash
# Role 7 — assemble, grade, mix, encode. Run after assets/part{1,2}.mp4 + .srt and assets/broll_src/*.mp4 exist.
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_PATH=/opt/node22/lib/node_modules
A=assets
echo "== 1. avatar frames + voice"
rm -rf $A/avatar_frames && mkdir -p $A/avatar_frames
ffmpeg -v error -y -i $A/part1.mp4 -i $A/part2.mp4 -filter_complex \
  "[0:v]fps=30,scale=1920:1080:flags=lanczos,setsar=1[v0];[1:v]fps=30,scale=1920:1080:flags=lanczos,setsar=1[v1];[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -q:v 2 $A/avatar_frames/f_%06d.jpg -map "[a]" -ar 44100 -ac 2 out/voice.wav
echo "== 2. b-roll frames (cover-crop to 1920x1080, cinematic grade)"
for f in $A/broll_src/*.mp4; do
  c=$(basename "$f" .mp4); rm -rf $A/broll/$c; mkdir -p $A/broll/$c
  ffmpeg -v error -y -i "$f" -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,eq=contrast=1.08:saturation=0.9:gamma=0.96,colorbalance=rh=0.04:bh=-0.03:rs=-0.02:bs=0.03" -q:v 2 $A/broll/$c/f_%05d.jpg
done
echo "== 3. timing from HeyGen captions → beat sheet → sfx → audio"
python3 build/timing.py && python3 build/beats.py
node build/render.js sfx build/sfx.json 2>/dev/null
python3 build/audio.py
build/music.sh
DUR=$(python3 -c "import json;print(json.load(open('build/timeline.json'))['duration'])")
echo "== 4. render compositor ($DUR s) in 4 workers"
P=4; pids=()
for i in $(seq 0 $((P-1))); do
  s=$(python3 -c "print(round($DUR*$i/$P*30)/30)"); e=$(python3 -c "print(round($DUR*($i+1)/$P*30)/30)")
  node build/render.js video $s $e out/chunk_$i.mp4 2> out/render_$i.log & pids+=($!)
done
for p in "${pids[@]}"; do wait $p; done
printf "file 'chunk_%d.mp4'\n" 0 1 2 3 > out/chunks.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks.txt -c copy out/picture.mp4
echo "== 5. mix (voice cleanup + sfx + ducked music bed) + grade + encode"
ffmpeg -v error -y -i out/picture.mp4 -i out/voice.wav -i out/sfx.wav -i out/music.wav -filter_complex "
 [1:a]highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=2,asplit[vo][key];
 [2:a]volume=-7dB[s];
 [3:a]lowpass=f=9000,volume=-11dB[m0];[m0][key]sidechaincompress=threshold=0.05:ratio=2:attack=150:release=900:makeup=1[m];
 [vo][s][m]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=summary[a];
 [0:v]eq=contrast=1.03:saturation=1.03,noise=alls=4:allf=t,format=yuv420p[v]" \
 -map "[v]" -map "[a]" -c:v libx264 -profile:v high -preset slow -b:v 18M -maxrate 20M -bufsize 36M -r 30 \
 -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest out/Budgeting_Magic_Trick_1080p.mp4
ffmpeg -v error -i out/Budgeting_Magic_Trick_1080p.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12 > out/loudness.txt || true
echo "done → out/Budgeting_Magic_Trick_1080p.mp4"

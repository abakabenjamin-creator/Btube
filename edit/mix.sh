#!/usr/bin/env bash
# Role 6: music bed + voice cleanup + SFX -> final mix at -14 LUFS / -1 dBTP.
# usage: mix.sh <source.mp4> <sfx.wav> <music_dir> <out.wav>
set -euo pipefail
SRC=$1; SFX=$2; MUS=$3; OUT=$4
DUR=413.12
TMP=$(mktemp -d)
# Music: suspenseful hook under the open, then low lo-fi bed (three tracks, 4 s crossfades).
ffmpeg -v error -y -i "$MUS/614.mp3" -i "$MUS/766.mp3" -i "$MUS/135.mp3" -i "$MUS/988.mp3" -filter_complex "
 [0:a]atrim=0:17.5,afade=t=in:d=0.4,afade=t=out:st=14.5:d=3,volume=-1dB,aresample=48000,aformat=channel_layouts=stereo[hook];
 [1:a]aresample=48000,aformat=channel_layouts=stereo[l1];
 [2:a]aresample=48000,aformat=channel_layouts=stereo[l2];
 [3:a]aresample=48000,aformat=channel_layouts=stereo[l3];
 [l1][l2]acrossfade=d=4[l12];[l12][l3]acrossfade=d=4,afade=t=in:d=2.5[lofi];
 [lofi]adelay=14500|14500[lofid];
 [hook][lofid]amix=inputs=2:normalize=0,atrim=0:$DUR,afade=t=out:st=$(echo "$DUR-3" | bc):d=3[m]" -map "[m]" "$TMP/music.wav"
# Bring music to a known loudness before ducking.
ffmpeg -v error -y -i "$TMP/music.wav" -af loudnorm=I=-30:TP=-6:LRA=11 -ar 48000 "$TMP/music_n.wav"
ffmpeg -v error -y -i "$SRC" -i "$TMP/music_n.wav" -i "$SFX" -filter_complex "
 [0:a]aresample=48000,highpass=f=75,lowpass=f=16000,acompressor=threshold=-21dB:ratio=2.5:attack=8:release=120:makeup=2dB,aformat=channel_layouts=stereo,asplit=2[v][key];
 [1:a][key]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=350[mduck];
 [2:a]aformat=channel_layouts=stereo,volume=-1dB[s];
 [v][mduck][s]amix=inputs=3:normalize=0:duration=first[mix]" -map "[mix]" -ar 48000 "$TMP/premix.wav"
# Two-pass loudness normalisation to -14 LUFS integrated, -1 dBTP.
J=$(ffmpeg -hide_banner -i "$TMP/premix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$TMP/premix.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 "$OUT"
cp "$TMP/music_n.wav" "${OUT%.wav}_music.wav"
rm -rf "$TMP"

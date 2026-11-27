"""'The River' short: Part 1 (3/4 angle) + Part 2 (frontal) cut in the monk1 / ABAKA SIKA style.
Writes build/scenes.json (graphics), work/base.mp4 (1080p video base) and work/dialog.wav."""
import json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FPS = 25
W = json.load(open(f'{ROOT}/words.json'))
O2 = 5.75                     # Part 2 starts here (0.35 s breath after Part 1 ends at 5.40)
END0 = 16.0; DUR = 19.5       # end card from END0
def words(part, i0, i1, off, key=(), impact=False):
    ws = W[part][i0:i1]
    return [dict(w=w['w'], t=round(w['s'] + off, 2), key=w['w'].lower() in key or w['w'].strip('.,').lower() in key) for w in ws]

# ---- shots (global time): ('P', file, src_off, zoom) presenter / ('B', clip id, clip start) stock
SHOTS = [
    (0.00, 1.88, 'B', 570, 3.0),             # "A river doesn't cut through rock"
    (1.88, 4.30, 'P', 'part1_clean', 0.0),   # "with strength, it does it by showing up" -- off-camera angle: SIDE layout
    (4.30, 5.75, 'B', 32799, 1.0),           # "every single day" (daily run)
    (5.75, 7.47, 'P', 'part2', -O2),         # "Your habits are the river."  (frontal camera)
    (7.47, 9.00, 'B', 15375, 4.0),           # "Your goals are the rock."
    (9.00, 11.10, 'P', 'part2', -O2),        # "Be patient. Keep flowing."
    (11.10, 12.75, 'B', 8129, 2.0),          # "One day people will call it a" (river cutting the canyon)
    (12.75, DUR, 'B', 11022, 3.0),           # "canyon."  (Grand Canyon reveal, holds under the end card)
]
caps = [
    dict(t0=0.0, t1=1.88, words=words('part1', 0, 6, 0, key=('river',)), broll=True, size=72),
    dict(t0=4.28, t1=5.62, words=words('part1', 14, 17, 0, key=('day.',)), broll=True, size=72),
    dict(t0=O2, t1=7.47, words=words('part2', 0, 5, O2, key=('river',))),
    dict(t0=7.59, t1=9.00, words=words('part2', 5, 10, O2, key=('rock',)), broll=True, size=72),
    dict(t0=9.17, t1=11.10, words=words('part2', 10, 14, O2, key=('flowing',)), impact=True),
    dict(t0=11.19, t1=12.75, words=words('part2', 14, 21, O2), broll=True, size=72),
    dict(t0=12.75, t1=15.70, words=words('part2', 21, 22, O2, key=('canyon',)), broll=True, impact=True),
]
for c in caps: c['upper'] = True; c['pos'] = 'c'
for a, b in zip(caps, caps[1:]): a['t1'] = min(a['t1'], b['t0'] - 0.3)   # each line has faded out before the next one rises
caps[0]['t1'] = 1.88 - 0.3   # ...and before the side layout starts   # each line has faded out before the next one rises
F = '"Inter", sans-serif'
end = dict(t0=END0, els=[
    dict(type='text', str='The River', at=END0 + 0.25, x=960, y=330, size=110, align='center'),
    dict(type='text', str='Your habits are the *river.*', at=END0 + 0.7, x=960, y=500, size=56, align='center', weight=700, font=F),
    dict(type='text', str='Your goals are the rock.', at=END0 + 1.0, x=960, y=590, size=56, align='center', weight=700, font=F),
    dict(type='text', str='Keep flowing.', at=END0 + 1.3, x=960, y=680, size=56, align='center', weight=700, font=F),
    dict(type='text', str='Follow for more', at=END0 + 1.8, x=960, y=880, size=40, align='center', weight=600, font=F, color='rgba(255,255,255,0.8)'),
])
# off-camera (3/4) angle: he is pushed left, the words sit on the empty right side (channel rule)
SIDES = [dict(t0=1.88, t1=4.30, heading='Not with strength', body=[dict(str='It does it by *showing up*', at=2.86, span=1.16)])]
scenes = dict(duration=DUR, broll=[], images=[], cards=[], overlays=[], sides=SIDES, captions=caps,
              chapters=[dict(t=0.3, label='The River')], end=end)
json.dump(scenes, open(f'{ROOT}/build/scenes.json', 'w'), indent=1)

# ---- base video (1080p25): presenter untouched framing (full torso) with a 3% bottom-anchored push on the frontal
# shots; stock gets a slow 6% push-in and a gentle grade toward the dark/warm A-roll
d = f'{ROOT}/work/base'; os.makedirs(d, exist_ok=True); lst = []
enc = ['-c:v', 'libx264', '-preset', 'fast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']
for i, (a, b, kind, src, off) in enumerate(SHOTS):
    n = round(b * FPS) - round(a * FPS); out = f'{d}/s{i:02d}.mp4'; lst.append(out); D = b - a
    if kind == 'B':
        Z = f"(1+0.06*t/{D:.3f})"
        vf = (f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,fps=25,"
              f"scale=w='2*trunc(960*{Z})':h='2*trunc(540*{Z})':eval=frame:flags=lanczos,crop=1920:1080:'(iw-1920)/2':'(ih-1080)/2',"
              f"eq=contrast=1.05:saturation=0.92:brightness=-0.02")
        cmd = ['-stream_loop', '-1', '-ss', f'{off:.3f}', '-i', f'{ROOT}/clips/{src}.mp4']
    else:
        st = a + off
        pre = ''
        if src.startswith('part1'):   # push him left by SH px; the freed right strip continues the room (mirrored sofa, softened)
            SH = 240
            pre = f"split[m][e];[m]crop={1920-SH}:1080:{SH}:0[l];[e]crop={SH}:1080:{1920-SH}:0,hflip,boxblur=3[r];[l][r]hstack,"
        if src == 'part2':
            Z = f"(1+0.03*t/{D:.3f})"
            pre = f"scale=w='2*trunc(960*{Z})':h='2*trunc(540*{Z})':eval=frame:flags=lanczos,crop=1920:1080:'920*({Z}-1)':'1080*({Z}-1)',"
        vf = pre + 'tpad=stop_mode=clone:stop_duration=5,fps=25'
        cmd = ['-ss', f'{st:.3f}', '-i', f'{ROOT}/src/{src}.mp4']
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *cmd, '-filter_complex' if 'split' in vf else '-vf', vf, '-frames:v', str(n), *enc, out], check=True)
open(f'{d}/list.txt', 'w').write(''.join(f"file '{x}'\n" for x in lst))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{d}/list.txt', '-c', 'copy', f'{ROOT}/work/base.mp4'], check=True)
# ---- dialog: Part 1 at 0, Part 2 at O2
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{ROOT}/src/part1.mp4', '-i', f'{ROOT}/src/part2.mp4', '-filter_complex',
                f"[0:a]aresample=48000,pan=mono|c0=c0[a];[1:a]aresample=48000,pan=mono|c0=c0,adelay={int(O2*1000)}[b];[a][b]amix=2:normalize=0,apad=whole_dur={DUR}",
                '-t', str(DUR), '-c:a', 'pcm_s16le', f'{ROOT}/work/dialog.wav'], check=True)
print('ok', len(SHOTS), 'shots', DUR, 's')

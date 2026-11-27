"""Base video layer (1080p25): presenter shots cut exactly on his words (front cam = simon_main, side cam = ring-cleaned
money_while_you_sleep), stock footage under the voiceover, black under the graphic cards. Gentle 3% push-in on every
other long presenter shot; rule moments hold the original framing, then slide him left (mirrored room fills the right).
Breaths between speakers: extend the neighbouring stock clip, or hold his last frame. -> work/base.mp4"""
import json, os, subprocess
ROOT = '/home/user/Btube/simon'; FPS = 25
E = json.load(open(f'{ROOT}/build/edl.json')); SC = json.load(open(f'{ROOT}/build/scenes.json')); B = json.load(open(f'{ROOT}/build/broll.json'))
NF = round(SC['duration'] * FPS)
FILE = {'P': f'{ROOT}/src/simon_main.mp4', 'S': f'{ROOT}/src/side_clean.mp4'}
SH = 380
runs = []   # lines that run straight on in the same recording become ONE continuous shot (no cut, no freeze)
for p in E['pieces']:
    if p['src'] == 'V': continue
    a = p['start']; b = a + p['out'] - p['in_']; off = p['in_'] - a
    if runs and runs[-1]['src'] == p['src'] and abs(runs[-1]['t1'] - a) < 1e-3 and abs(runs[-1]['off'] - off) < 1e-3: runs[-1]['t1'] = b
    else: runs.append(dict(t0=a, t1=b, src=p['src'], off=off))
shots = []; n_long = 0
for r in runs:
    a, b = r['t0'], r['t1']; z = 0
    if b - a >= 8: n_long += 1; z = 3 if n_long % 2 == 1 else 0
    sl = [s for s in B['slide'] if a - 0.05 <= s[0] < b]
    held = [s for s in B['slide'] if s[1] <= a + 0.05 and a < s[2] - 0.05]       # later line of a rule moment: stays pushed aside
    shots.append(dict(r, zoom=0 if (sl or held) else z, slide=sl[0] if sl else None, held=bool(held)))
own = [None] * NF
for k, br in enumerate(B['broll']):
    for f in range(round(br['t0'] * FPS), min(NF, round(br['t1'] * FPS))): own[f] = ('broll', k)
for k, sh in enumerate(shots):
    for f in range(round(sh['t0'] * FPS), min(NF, round(sh['t1'] * FPS))): own[f] = ('shot', k)
f = 0
while f < NF:
    if own[f] is not None: f += 1; continue
    g = f
    while g < NF and own[g] is None: g += 1
    prev = own[f - 1] if f else None; nxt = own[g] if g < NF else None
    if (g - f) <= round(1.6 * FPS):
        fill = prev if prev and prev[0] == 'broll' else nxt if nxt and nxt[0] == 'broll' else ('hold', prev[1]) if prev and prev[0] == 'shot' else ('hold0', nxt[1]) if nxt and nxt[0] == 'shot' else None
        for h in range(f, g): own[h] = fill
    f = g
segs = []; f = 0
while f < NF:
    g = f
    while g < NF and own[g] == own[f]: g += 1
    segs.append((own[f], f, g)); f = g
d = f'{ROOT}/work/base'; os.makedirs(d, exist_ok=True); lst = []
enc = ['-c:v', 'libx264', '-preset', 'fast', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']
for i, (o, f0, f1) in enumerate(segs):
    out = f'{d}/s{i:03d}.mp4'; n = f1 - f0; lst.append(out); T0 = f0 / FPS
    if o is None:
        cmd = ['-f', 'lavfi', '-i', f'color=c=0x0A0A0A:s=1920x1080:r={FPS}']; vf = None
    elif o[0] == 'broll':
        br = B['broll'][o[1]]; D = max(1.0, br['t1'] - br['t0']); off = max(0.0, T0 - br['t0']) + 0.3
        Z = f"(1+0.06*(t+{off:.3f})/{D + 0.5:.3f})"
        vf = (f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,fps=25,"
              f"scale=w='2*trunc(960*{Z})':h='2*trunc(540*{Z})':eval=frame:flags=lanczos,crop=1920:1080:'(iw-1920)/2':'(ih-1080)/2',"
              f"eq=contrast=1.04:saturation=0.92:brightness=-0.02")
        cmd = ['-stream_loop', '-1', '-ss', f'{off:.3f}', '-i', f"{ROOT}/clips/{br['id']}.mp4"]
    else:
        sh = shots[o[1]]
        st = T0 + sh['off']   # breaths between speakers: the presenter's real frames just before/after his line (no freeze frames)
        pre = ''
        if sh['slide'] and o[0] == 'shot':
            s0, s1, se = sh['slide']; a = s0 - T0; dd = s1 - s0
            u = f"clip((t-{a:.3f})/{dd:.3f}\\,0\\,1)"; Ez = f"(3*pow({u}\\,2)-2*pow({u}\\,3))"
            pre = f"[1:v]setsar=1[r];[0:v][r]hstack=shortest=1,crop=1920:1080:'{SH}*{Ez}':0,"
        elif (sh['slide'] and o[0] == 'hold' and T0 >= sh['slide'][1]) or (sh.get('held') and o[0] in ('shot', 'hold')):
            pre = f"[1:v]setsar=1[r];[0:v][r]hstack=shortest=1,crop=1920:1080:{SH}:0,"
        elif sh['zoom'] == 3:
            D = sh['t1'] - sh['t0']; tin = min(D, T0 - sh['t0'])
            Z = f"(1+0.03*max(0\\,t+{tin:.3f})/{D:.3f})"
            pre = f"scale=w='2*trunc(960*{Z})':h='2*trunc(540*{Z})':eval=frame:flags=lanczos,crop=1920:1080:'920*({Z}-1)':'1080*({Z}-1)',"
        vf = pre + 'tpad=stop_mode=clone:stop_duration=30,fps=25'
        cmd = ['-ss', f'{max(0, st):.3f}', '-i', FILE[sh['src']]]
    if vf and '[1:v]' in vf: cmd += ['-loop', '1', '-framerate', '25', '-i', f'{ROOT}/work/plate_main.png']   # clean room plate: one lamp only
    flt = [] if vf is None else (['-filter_complex', vf] if ('split' in vf or '[1:v]' in vf) else ['-vf', vf])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *cmd, *flt, '-frames:v', str(n), *enc, out], check=True)
open(f'{d}/list.txt', 'w').write(''.join(f"file '{x}'\n" for x in lst))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{d}/list.txt', '-c', 'copy', f'{ROOT}/work/base.mp4'], check=True)
json.dump(shots, open(f'{ROOT}/build/shots.json', 'w'), indent=0)
print(f"{len(segs)} segments, {sum(1 for s in shots if s['zoom'] == 3)} push-ins, {sum(1 for s in shots if s['slide'])} slides, {NF} frames")

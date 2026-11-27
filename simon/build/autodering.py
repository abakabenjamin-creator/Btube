"""Automatic ring removal: MediaPipe hand landmarks predict where the ring sits on his LEFT ring finger
(65% of the way from knuckle lm13 to joint lm14); inside a small window there, the bright/grey metal band is
masked and inpainted from the surrounding skin. The big watch is never in the window.
usage: autodering.py in.mp4 hands.json out.mp4 qa_dir [f0 f1]"""
import cv2, json, sys, os, subprocess, numpy as np
src, hj, dst, qa = sys.argv[1:5]; F0 = int(sys.argv[5]) if len(sys.argv) > 5 else 0; F1 = int(sys.argv[6]) if len(sys.argv) > 6 else 10**9
H = json.load(open(hj)); os.makedirs(qa, exist_ok=True)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(3)); Hh = int(cap.get(4))
def ring_pts(n):
    out = []
    for h in H.get(str(n), []):          # both hands: a left/right label flip must not leave the ring behind
        p = np.array(h['pts']); a, b = p[13], p[14]; seg = np.hypot(*(b - a))
        out.append((a + 0.5 * (b - a), seg, (b - a) / max(1e-6, seg), h['side']))   # middle of the ring finger's first segment
    return out
pred = {int(k): ring_pts(int(k)) for k in H}
# carry each hand's ring point across tracking gaps (up to 12 frames) by interpolation
for side in ('Left', 'Right'):
    ks = sorted(k for k, v in pred.items() if any(x[3] == side for x in v))
    for k0, k1 in zip(ks, ks[1:]):
        if 1 < k1 - k0 <= 12:
            A = [x for x in pred[k0] if x[3] == side][0]; B = [x for x in pred[k1] if x[3] == side][0]
            for n in range(k0 + 1, k1):
                u = (n - k0) / (k1 - k0)
                if not any(x[3] == side for x in pred.get(n, [])):
                    pred.setdefault(n, []).append((A[0] * (1 - u) + B[0] * u, A[1], A[2], side))
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{Hh}', '-r', str(fps), '-i', '-', '-i', src,
                      '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-c:a', 'copy', dst], stdin=subprocess.PIPE)
n = 0; stats = []
while True:
    ok, f = cap.read()
    if not ok: break
    for pr in (pred.get(n, []) if F0 <= n < F1 else []):
        (cx, cy), seg, dv, _side = pr; cx, cy = int(cx), int(cy); R = int(max(26, min(60, seg * 0.85)))
        x0, y0, x1, y1 = max(0, cx - R), max(0, cy - R), min(W, cx + R), min(Hh, cy + R)
        roi = f[y0:y1, x0:x1]
        if roi.size:
            hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV).astype(int); V, S = hsv[..., 2], hsv[..., 1]
            skin = np.median(V); sS = np.median(S)
            m = (((V > skin + 30) & (S < 110)) | ((S < sS - 40) & (V > 40))).astype(np.uint8)
            num, lab, st, cen = cv2.connectedComponentsWithStats(m); keep = np.zeros_like(m)
            for i in range(1, num):
                a = st[i][4]; ccx, ccy = cen[i]
                if 4 <= a < 900 and abs(ccx - (cx - x0)) < R * 0.7 and abs(ccy - (cy - y0)) < R * 0.7: keep[lab == i] = 1
            # always clear a band across the finger at the predicted ring spot (dull grey rings don't trip the detector)
            band = np.zeros_like(keep); L = max(8, int(seg * 0.75)); T = max(10, int(seg * 1.15))   # whole first segment of the finger
            ang = np.degrees(np.arctan2(dv[1], dv[0]))
            box = cv2.boxPoints(((cx - x0, cy - y0), (T, L), ang)).astype(np.int32); cv2.fillPoly(band, [box], 1)
            if _side == 'Left' or keep.any(): keep |= band   # ring hand: always; other hand only if metal was actually seen
            if keep.any():
                keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
                mask = np.zeros(f.shape[:2], np.uint8); mask[y0:y1, x0:x1] = keep * 255
                g = cv2.inpaint(f, mask, 9, cv2.INPAINT_TELEA)
                if n % 1 == 0:
                    c0 = f[max(0, cy - 60):cy + 60, max(0, cx - 90):cx + 90]; c1 = g[max(0, cy - 60):cy + 60, max(0, cx - 90):cx + 90]
                    if c0.size: cv2.imwrite(f'{qa}/{n:05d}_{_side[0]}.png', cv2.resize(np.hstack([c0, c1]), (360, 120)))
                f = g; stats.append(n)
    p.stdin.write(f.tobytes()); n += 1
p.stdin.close(); p.wait(); print('frames', n, 'cleaned', len(stats))

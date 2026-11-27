"""Hand landmarks per frame (MediaPipe Tasks, video mode). Ring sits on the ring finger's first segment:
between landmark 13 (MCP) and 14 (PIP). Writes JSON {frame: [[x13,y13,x14,y14,handedness,score],...]}"""
import cv2, json, sys, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
src, out = sys.argv[1], sys.argv[2]; f0=int(sys.argv[3]) if len(sys.argv)>3 else 0; f1=int(sys.argv[4]) if len(sys.argv)>4 else 10**9
opt = vision.HandLandmarkerOptions(base_options=BaseOptions(model_asset_path='/home/user/Btube/simon/models/hand_landmarker.task'),
      running_mode=vision.RunningMode.VIDEO, num_hands=2, min_hand_detection_confidence=0.3, min_hand_presence_confidence=0.3, min_tracking_confidence=0.3)
lm = vision.HandLandmarker.create_from_options(opt)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); n = 0; res = {}
while True:
    ok, fr = cap.read()
    if not ok or n >= f1: break
    if n >= f0:
        H, W = fr.shape[:2]
        r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)), int(n * 1000 / fps))
        hs = []
        for k, h in enumerate(r.hand_landmarks):
            p = [(l.x * W, l.y * H) for l in h]
            hs.append(dict(side=r.handedness[k][0].category_name, score=round(r.handedness[k][0].score, 2), pts=[[round(x, 1), round(y, 1)] for x, y in p]))
        res[n] = hs
    n += 1
json.dump(res, open(out, 'w')); print('frames', len(res), 'with hands', sum(1 for v in res.values() if v))

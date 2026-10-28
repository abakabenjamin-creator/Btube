# Seven Small Things — captioned edit

Source: HeyGen video `754974b8a07ee08ce77a4221af3298e7` (720×1280, 46 s).

- **Framing:** kept as-is. The source already matches the wide reference (Image A).
- **Captions:** `build/captions.py` turns faster-whisper word timings (`build/words.json`) into ASS captions: Inter Black, white uppercase with a black outline, the spoken word in brand orange `#FF6B1E`, and a large orange `#N` pop for each tip number.
- **Music:** HeyGen library track `b65c8d21f07b49abab2c63226e87960a` ("uplifting motivational lo-fi with energetic build"), −17 dB, ducked under the voice with a sidechain compressor, 2.4 s fade-out.
- **Master:** 1080×1920 H.264 (CRF 18), AAC 256k, loudness-normalised to −14 LUFS.

Rebuild: put the source in `src/a.mp4` and the track in `src/music.wav`, then run `python3 build/captions.py build/words.json build/captions.ass`, followed by the ffmpeg command in `build/render.sh`.

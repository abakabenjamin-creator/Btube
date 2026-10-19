# Budgeting Magic Trick — video build

Automated edit pipeline for the "6 budgeting mix-ups + three-jar plan" video (Glass UI / Clean Finance style).

- A-roll: HeyGen digital twin `98487b8a84d0495884170e28d78e1c85`, **Avatar V** engine (IDs in `assets/heygen_manifest.json`).
- Voice, UI sound effects and a very low ambient music bed (HeyGen music catalog), ducked under the voice.
- See `EDIT_LOG.md` for every judgment call and `beat_sheet.md` for the timeline.

## Finish the video
Needs `files2.heygen.ai` and `resource2.heygen.ai` allowed in the environment's network settings.

```bash
cd budget-video
npm install
pip install scipy numpy
build/fetch.sh     # downloads the Avatar V A-roll, captions, B-roll and music bed
build/finish.sh    # re-times beats, renders, mixes → out/Budgeting_Magic_Trick_1080p.mp4
```

The signed A-roll and music links in `fetch.sh` expire around 2026-10-26; after that, refresh them with HeyGen `get_video`.

# Aircraft Model Interaction Video

This workspace packages the verified interaction-edit workflow for the aircraft model generation platform video.

## Baseline

Protected behavior:

- The accepted v5 edit is `93s` long.
- The video is `1750x1244` at `30fps`.
- The final 3-second tail frame contains only the glowing `Toni.asia` wordmark.
- The exported file has an AAC stereo BGM track.
- The current golden export SHA256 is recorded in `video_interaction_analysis/baseline_manifest.json`.

Run the baseline before and after future video-edit changes:

```powershell
python video_interaction_analysis/check_video_baseline.py
```

The command exits non-zero if the golden export is missing or its media properties/hash no longer match the accepted baseline.

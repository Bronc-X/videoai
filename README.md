# Video AI Baselines

This repository contains two protected baselines.

## 电商产品视频 AI 专家工具

当前 baseline 保护的是首帧/视频生成工作台的关键链路：

- 前端图片接口和视频接口分开填写。
- 前端填写的 `base_url` / `api_key` 会经本地后端代理转发。
- 本地拖图可进入首帧请求素材列表。
- 上游 Cloudflare 524 / 非 JSON 错误会被规整成短错误文案。
- 构建必须通过。

未来修改首帧、视频、接口代理或错误展示前后，都必须运行：

```bash
npm run test:baseline
```

该命令失败时不要继续发布或推送。

## Aircraft Model Interaction Video

This baseline protects the verified interaction-edit workflow for the aircraft model generation platform video.

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

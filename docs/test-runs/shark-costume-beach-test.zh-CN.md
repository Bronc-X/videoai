# 鲨鱼充气服海边测试用例

## 测试目标

使用产品锁定型工作流，为蓝色充气鲨鱼服生成一个简单的海边搞笑视频。

该测试属于可穿戴充气服品类。在进入鲨鱼 SKU 级 Product Lock Card 之前，必须先继承 `docs/product-video-workflow.md` 中的品类级锁定规则。

优先级：

1. 货要对版
2. 动作有趣
3. 海边场景丰富
4. 时长更长

## 1. 产品图上传

### 已上传产品图

- `C:/Users/Administrator/Desktop/[video-test]/1.png`
- `C:/Users/Administrator/Desktop/[video-test]/2.png`
- `C:/Users/Administrator/Desktop/[video-test]/3.jpg`

### 产品图角色

- `1.png`：正面图，作为白色肚皮区域、拉链、透明露脸窗口、正面鳍位置和鞋子的权威参考
- `2.png`：侧面图，作为橙色鼓风机、黑色眼睛、黑色鳃纹、侧鳍、背鳍和侧面轮廓的权威参考
- `3.jpg`：背面图，作为背鳍、背部身体形状、尾巴/背部结构和背部接缝的权威参考

## 2. Product Lock Card

```json
{
  "product_label": "Blue inflatable shark costume",
  "category": "wearable_inflatable_costume",
  "costume_type": "shark",
  "category_lock": [
    "must remain a wearable inflatable costume",
    "must not become a real shark",
    "must not become a cartoon shark",
    "must not become a plush toy",
    "must not become a CGI creature",
    "must preserve inflated fabric, wrinkles, seams, zipper line, fan valve, leg openings, and black shoes"
  ],
  "authoritative_views": {
    "front": "C:/Users/Administrator/Desktop/[video-test]/1.png",
    "side": "C:/Users/Administrator/Desktop/[video-test]/2.png",
    "back": "C:/Users/Administrator/Desktop/[video-test]/3.jpg"
  },
  "main_identity": [
    "wearable inflatable shark costume",
    "bright blue inflatable body",
    "large white belly panel",
    "black round side eye",
    "black curved gill stripes",
    "side fins",
    "back fin and tail/back shape",
    "black shoes visible at bottom"
  ],
  "critical_lock_points": [
    {
      "name": "blue transparent PVC face-viewing window",
      "location": "upper front white belly panel",
      "rules": [
        "must remain a blue-tinted transparent vinyl window",
        "must keep shiny reflections and cross seam/reflection lines",
        "must not become a mouth",
        "must not become teeth",
        "must not become a logo, patch, or eye"
      ]
    },
    {
      "name": "orange circular fan valve",
      "location": "wearer's left side torso/waist, below side fin root and above hip area",
      "rules": [
        "must remain small, flat, circular, orange",
        "must stay fixed in the same side torso/waist position",
        "must not move to front belly, chest, back center, fin, tail, or legs",
        "must not be enlarged, duplicated, hidden, recolored, or reshaped"
      ]
    },
    {
      "name": "back fin and tail/back structure",
      "location": "rear body",
      "rules": [
        "must not split into extra fins",
        "must not change into a fish tail",
        "must not disappear or duplicate"
      ]
    }
  ],
  "preferred_video_angle": "three-quarter side angle that keeps the transparent front window and orange side fan valve visible",
  "motion_budget": {
    "mode": "high_accuracy",
    "max_rotation_degrees": 8,
    "allowed_actions": [
      "gentle inflatable bounce",
      "small fin lift",
      "small proud nod",
      "tiny one-step shuffle"
    ],
    "forbidden_actions": [
      "turn around",
      "spin",
      "jump",
      "walk far",
      "wild dance",
      "reveal unseen angles"
    ]
  },
  "status": "pending_user_confirmation"
}
```

## 3. 必需的用户确认

在生成首帧前，系统需要询问：

```text
请确认鲨鱼服的产品锁定点：

0. 这是一件可穿戴充气服，不是真实鲨鱼，也不是吉祥物。是否确认？
1. 位于白色肚皮上方的蓝色透明 PVC 露脸窗口，是否是关键锁定点？
2. 位于侧面腰腹位置的橙色圆形鼓风机，是否是关键锁定点？
3. 背鳍和尾巴/背部结构，是否是关键锁定点？
4. 推荐视频角度是否为三分之四侧面角度，并且同时保持正面透明窗口和侧面鼓风机可见？
5. 是否还有遗漏的锁定点？
```

本测试的预期确认结果：

```text
通过。透明窗口、橙色鼓风机、侧面鳃纹、背鳍、尾巴/背部形状、拉链、褶皱、接缝和黑色鞋子都是关键锁定点。
```

## 4. 首帧生成

### 首帧场景

鲨鱼服被放置在一个海边搞笑场景中。产品仍然是画面主角。

推荐场景：

```text
阳光明媚的海边小吃摊或柠檬水摊。画面里有沙滩、海水、小沙滩伞、毛巾、冷藏箱，以及一个在背景里觉得好笑的游客。鲨鱼服表现得像一位非常严肃的海边客服经理。
```

### 首帧 Prompt

```text
Use the provided product images as exact product references.

Create one realistic vertical 9:16 first-frame image for later image-to-video generation.

Product lock:
Preserve the same wearable inflatable shark costume exactly. Do not redesign, simplify, replace, recolor, or reinterpret the product.

Category lock:
This is a wearable inflatable costume. It must not become a real shark, cartoon shark, plush toy, CGI creature, or redesigned mascot. Preserve the inflated nylon/plastic fabric, air-filled volume, wrinkles, seams, zipper line, fan valve, leg openings, and black shoes.

Must preserve:
- bright blue inflatable body
- large white front belly panel
- vertical zipper line
- blue transparent PVC face-viewing window on the upper white belly panel
- black round side eye
- black curved gill stripes
- side fins with white underside
- back fin and tail/back structure
- orange circular fan valve on the wearer's left side torso/waist
- black shoes
- fabric wrinkles, seams, folds, and inflatable material

Critical details:
The blue transparent PVC face-viewing window must stay on the upper front white belly panel. It must look like a blue-tinted transparent vinyl window with shiny reflections and cross seam/reflection lines. It is not a mouth, not teeth, not a logo, not a patch, and not an eye.

The orange circular fan valve must stay small, flat, circular, orange, and located on the side torso/waist below the side fin root and above the hip. Do not move it to the front belly, chest, back center, fin, tail, or legs.

Scene:
A sunny beach snack stand with sand, ocean, a beach umbrella, towels, and a cooler. A beachgoer in the background looks amused. The costume is acting like a serious beach support manager.

Composition:
Vertical 9:16. Full body visible. Use a three-quarter side angle that keeps both the front transparent window and orange side fan valve visible. Do not crop head, fins, fan valve, transparent window, zipper, tail, or shoes.

Style:
Realistic commercial product image, clean lighting, sharp product detail.

Avoid:
No mouth, no red mouth, no teeth, no shark jaw, no new face opening, no human face visibility, no moved fan valve, no missing transparent window, no redesigned costume, no extra logos, no readable text, no subtitles, no hats, no sunglasses, no accessories, no cartoon, no real shark, no plush toy, no mascot redesign, no morphing, no transformation, no body deformation.
```

## 5. 首帧审核

用户或审核者必须批准首帧。

审核清单：

- [ ] 透明 PVC 露脸窗口正确
- [ ] 橙色圆形鼓风机位置正确
- [ ] 白色肚皮区域和拉链正确
- [ ] 黑色眼睛和鳃纹正确
- [ ] 侧鳍正确
- [ ] 背鳍和尾巴/背部结构合理，且没有复制或乱长
- [ ] 黑色鞋子可见
- [ ] 产品完整可见，没有被裁切
- [ ] 场景没有遮挡关键产品细节
- [ ] 首帧被批准为锁定视频首帧

如果任何一项失败，必须先重新生成首帧，再进入视频。

## 6. 视频生成

### 视频 Prompt

```text
Use the provided image as the locked first frame and exact product design.
The first frame is already approved and correct.
Generate a beach comedy video by animating this same inflatable shark costume only.
Do not redesign, reinterpret, replace, or redraw the costume.

STRICT PRODUCT LOCK:
The inflatable shark costume must remain identical to the first frame in every frame.
Preserve the exact blue transparent PVC face-viewing window on the upper white belly panel, the orange circular fan valve fixed on the same side torso/waist, the white belly panel, vertical zipper line, black round eye, black curved gill stripes, side fins, back fin, tail/back structure, blue legs, black shoes, all fabric wrinkles, seams, folds, and inflatable material.

CATEGORY LOCK:
This is a wearable inflatable costume, not a real shark, cartoon shark, plush toy, CGI creature, or redesigned mascot. Preserve the inflated nylon/plastic fabric, air-filled volume, wrinkles, seams, zipper line, fan valve, leg openings, and black shoes.

FRAGILE DETAIL LOCK:
The face-viewing window must remain a blue-tinted transparent vinyl window with shiny reflections and cross seam lines. It is not a mouth, not teeth, not a logo, not a patch, not an eye, and not decoration.

The orange fan valve must stay small, flat, circular, orange, and fixed in the exact same side torso/waist position. Do not move, enlarge, duplicate, hide, recolor, or reshape it.

The back fin and tail/back structure must not duplicate, split, melt, or turn into a fish tail.

SCENE:
A sunny beach comedy scene. The same shark costume acts like an overly serious beach support manager at a snack or lemonade stand. Sand, ocean, a beach umbrella, towels, a cooler, and one amused beachgoer are visible in the background.

MOTION:
High accuracy motion only. Gentle inflatable bounce, one fin slowly points at the stand, one small proud nod, then a tiny one-step shuffle. Body rotation must stay under 8 degrees. Keep the same three-quarter product angle so both the transparent window and orange fan valve remain visible. Do not reveal unseen angles. Do not turn around, walk far, spin, jump, or dance wildly.

CAMERA:
Vertical 9:16. Stable medium-wide shot. Full body visible most of the time. No scene cuts. No fast zoom. Do not crop the head, fins, transparent window, orange fan valve, zipper, tail, or black shoes.

AUDIO:
Use off-screen narration only if the model supports audio. The costume itself does not talk and does not open a mouth. Suggested line: "Beach support has arrived." Add soft ocean ambience. No subtitles.

NEGATIVE:
No mouth, no red mouth, no teeth, no shark jaw, no new face opening, no human face visibility, no moved fan valve, no missing transparent window, no redesigned costume, no extra logos, no readable text, no subtitles, no hats, no sunglasses, no accessories, no cartoon, no real shark, no plush toy, no mascot redesign, no morphing, no transformation, no body deformation, no duplicated back fin, no broken tail.
```

### 推荐模型设置

使用支持首帧图生视频的模型。

推荐请求设置：

```json
{
  "aspect_ratio": "9:16",
  "duration": 8,
  "mode": "high_accuracy",
  "camera": "static_or_slight_push_in",
  "audio": "optional_off_screen_only"
}
```

## 7. 视频审核

抽取以下时间点的帧：

- 0%
- 25%
- 50%
- 75%
- 100%

通过清单：

- [ ] 货对版评分至少 90
- [ ] 透明窗口保持正确
- [ ] 橙色鼓风机保持正确
- [ ] 背鳍和尾巴/背部结构保持正确
- [ ] 没有虚构嘴或牙齿
- [ ] 没有额外鳍或破损尾巴
- [ ] 动作足够有趣
- [ ] 海边场景存在
- [ ] 全身可见

如果产品失败，使用以下策略重试：

```text
将身体旋转降低到 5 度。
移除 shuffle。
只使用静态镜头。
简化海边场景。
要求透明窗口和鼓风机全程可见。
```

## 8. 测试通过定义

只有同时满足以下条件，该测试才算通过：

- 鲨鱼服仍然明显是同一个产品
- 透明窗口和橙色鼓风机被保留
- 背鳍和尾巴没有乱掉
- 视频具备海边搞笑场景
- 动作小但有趣

如果场景很好但产品漂移，该测试失败。


# 产品锁定型图生视频工作流

## 目标

建立一套可重复使用的产品视频生成工作流。在这套工作流里，产品准确性高于动作趣味、场景丰富度和视频时长。

优先级顺序：

1. 货要对版
2. 动作有趣
3. 场景丰富
4. 时长更长

生视频模型不应该被要求去发明、重新理解或重新设计产品。它只应该在一张已经审核通过的首帧图基础上，在严格动作限制内做动画延展。

## 产品品类

这套工作流主要面向可穿戴充气服产品。

示例：

- 充气鲨鱼服
- 充气青蛙服
- 充气恐龙或霸王龙服
- 充气相扑服
- 充气狮子服
- 其他可穿戴的充气动物、角色或趣味服装

这些产品有共同的核心风险：

- 模型可能把可穿戴充气服变成真实动物或卡通吉祥物。
- 模型可能添加产品中不存在的嘴、牙齿、眼睛、毛发、爪子或配饰。
- 模型可能移动或删除鼓风机。
- 模型可能隐藏或改变露脸窗口、拉链或穿戴开口。
- 模型可能在运动过程中破坏尾巴、鳍、耳朵、鬃毛、角、四肢或背部结构。
- 模型可能去掉充气布料质感，让产品看起来像橡胶、毛绒、CG 或真实生物。

产品必须始终保持为可穿戴充气服。

## 工作流总览

```text
产品图上传
-> Product Lock Card
-> 用户确认
-> 首帧生成
-> 首帧审核
-> 视频生成
-> 视频质量审核
-> 通过或用更严格限制重试
```

## 1. 产品图上传

### 1.0 充气服品类级锁定

这一品类里的每个产品，都应该在 SKU 级细节锁定之前，自动套用一层品类级锁定。

默认品类级锁定：

```text
该产品是一件可穿戴充气服。
它必须保持为真实的可穿戴充气产品，不能变成真实动物、卡通角色、毛绒玩具、CG 生物或重新设计的吉祥物。

必须保留充气尼龙/塑料布料、褶皱、接缝、折痕、充气体积、拉链或穿戴入口线、腿部开口、可见鞋子或脚套、侧面/背部附加结构，以及鼓风机或进气口。

不要添加新身体部位、面部特征、牙齿、爪子、毛发、鳞片、配饰、logo、文字或图案，除非这些内容已经存在于上传的产品图中。
```

这层品类级锁定必须始终和 SKU 级 Product Lock Card 一起使用。

### 1.1 必需图片

最低输入：

- 正面图
- 侧面图
- 背面图

推荐输入：

- 正面图
- 左侧图
- 右侧图
- 背面图
- 每个易漂移细节的特写图
- 如果有真实使用图，也可以额外上传

易漂移细节指的是视频模型经常移动、删除、放大、缩小或重新设计的部件。

示例：

- 透明窗口
- 鼓风机、按钮、开关、logo、通风口
- 把手、绑带、拉链、轮子、脚部、鞋子
- 鳍、尾巴、耳朵、袖子、开口、接缝
- 印刷图案或重复纹样
- 鬃毛、角、嘴鼻、头冠、肚皮、布料上印刷的嘴、布料上印刷的爪子

### 1.1.1 充气服图片要求

对于充气服，上传流程应尽量要求以下视图：

- 完整正面图，用于展示露脸窗口、肚皮区域、拉链或印刷脸部
- 完整侧面图，用于展示鼓风机、手臂/鳍/腿部形态和侧面轮廓
- 完整背面图，用于展示尾巴、背鳍、鬃毛、拉链或背部接缝结构
- 鼓风机或进气口特写
- 露脸窗口或人脸开口特写
- 特殊附加结构特写，例如尾巴、鳍、耳朵、鬃毛、角、爪子或肚皮形状

如果没有任何图片展示鼓风机或露脸开口，系统应该提醒用户，因为这些部位属于高风险漂移点。

### 1.2 图片要求

上传的产品图应满足以下要求：

- 所有图片必须是同一个 SKU、同一个配色
- 产品清晰、锐利，不能被遮挡
- 重要边缘不能被裁切
- 产品在画面中足够大，可以看清细节
- 光线足够中性，能识别真实颜色
- 不要使用强滤镜、风格化渲染图，或混入无关产品
- 优先使用白底或干净背景

如果不同图片之间存在冲突，系统必须暂停，并询问用户哪张图片更权威。

### 1.3 系统提取

上传后，系统生成一张 Product Lock Card。

Product Lock Card 必须包含：

- 产品名称或临时标签
- 服装类型
- 品类级锁定
- 主要视觉身份
- 必须可见的锁定点
- 易漂移细节
- 禁止变化
- 推荐镜头角度
- 最大安全动作幅度
- 用户确认状态

示例 schema：

```json
{
  "product_label": "Blue inflatable shark costume",
  "category": "wearable_inflatable_costume",
  "costume_type": "shark",
  "category_lock": [
    "must remain a wearable inflatable costume",
    "must not become a real animal, cartoon character, plush toy, CGI creature, or redesigned mascot",
    "must preserve inflated fabric, wrinkles, seams, zipper or entry line, leg openings, foot covers or shoes, and fan valve"
  ],
  "main_identity": [
    "bright blue inflatable wearable body",
    "large white front belly panel",
    "black round eye",
    "black curved gill stripes"
  ],
  "locked_landmarks": [
    {
      "name": "blue transparent PVC face-viewing window",
      "location": "upper front white belly panel",
      "must_remain_visible": true,
      "forbidden_changes": [
        "must not become a mouth",
        "must not become teeth",
        "must not become a logo",
        "must not move"
      ]
    }
  ],
  "fragile_details": [],
  "preferred_angle": "three-quarter side angle that shows front window and side valve",
  "max_rotation_degrees": 8,
  "status": "pending_user_confirmation"
}
```

### 1.3.1 服装类型模板

系统应根据服装类型预填可能需要锁定的部位。用户可以在生成前编辑这些内容。

鲨鱼：

- 鳍
- 尾巴或背鳍结构
- 鳃纹
- 侧面眼睛
- 肚皮区域
- 露脸窗口
- 鼓风机

青蛙：

- 大眼睛形状
- 嘴或笑脸印花，如果产品上有
- 肚皮区域
- 蹼状手脚，如果产品上有
- 露脸窗口或露脸开口
- 鼓风机

恐龙或霸王龙：

- 头部形状和嘴鼻
- 印刷或附着的牙齿，仅在产品图里存在时保留
- 小手臂
- 尾巴
- 背部脊刺或凸起，如果产品上有
- 肚皮区域
- 露脸开口
- 鼓风机

相扑：

- 圆润的充气身体轮廓
- 印刷腰带或相扑兜裆布区域
- 头部/发型印花或头部开口
- 手臂和腿部开口
- 布料褶皱和肚皮形状
- 鼓风机

狮子：

- 鬃毛形状和颜色
- 露脸开口或印刷脸部
- 耳朵
- 尾巴
- 爪子或脚套
- 肚皮区域，如果产品上有
- 鼓风机

通用充气服：

- 主体身体轮廓
- 露脸窗口或露脸开口
- 鼓风机或进气口
- 拉链或穿戴入口线
- 手臂、腿部和脚部开口
- 特殊附加结构
- 印刷细节
- 布料褶皱和接缝

### 1.3.2 高风险漂移点

对于所有充气服，以下部位默认被视为高风险：

- 鼓风机或进气口
- 露脸窗口或人脸开口
- 拉链或穿戴入口接缝
- 尾巴、背鳍、鬃毛、脊刺、角、耳朵或其他附加结构
- 脚套、黑鞋或可见鞋子
- 印刷面部特征
- 肚皮区域或中央色块

Product Lock Card 应默认把这些标记为 critical，除非用户明确降低它们的优先级。

### 1.4 用户确认

系统必须在生成首帧之前，让用户确认 Product Lock Card。

面向用户的确认问题：

```text
请在生成首帧前确认产品锁定点。

1. 这些是否是必须保留的产品细节？
2. 是否遗漏了任何细节？
3. 如果模型必须在多张图中选择一张作为权威参考，哪张图最权威？
4. 鼓风机或进气口在哪里？
5. 露脸窗口或人脸开口在哪里？
6. 哪些附加结构绝对不能变化，例如尾巴、鳍、耳朵、鬃毛、脊刺、角、手臂、腿部或脚套？
```

用户可以：

- 通过
- 编辑锁定点
- 将某个细节标记为 critical
- 上传更多细节图
- 选择权威产品视图

只要 Product Lock Card 还没有被确认，就不能进入首帧生成。

## 2. 首帧生成

### 2.1 目的

首帧是一张已经审核通过的“产品入景图”，后续视频会以它作为精确起始帧。

首帧模型只应该解决一个问题：

```text
在保留产品结构的前提下，把正确产品放进指定场景里。
```

它不应该被允许创造性地重新设计产品。

### 2.2 首帧策略

推荐策略：

1. 使用最权威的产品视图作为主体。
2. 其他视图只用于保持结构和易漂移细节。
3. 围绕产品生成所需场景。
4. 保持产品角度接近已上传图片中的某个已知角度。
5. 避免需要模型发明未知产品结构的新角度。

对于复杂产品，不要在首帧里要求夸张姿势。应使用稳定姿势，确保关键细节可见。

对于充气服，首帧通常应使用三分之四侧面角度，尽量同时展示鼓风机和露脸开口/露脸窗口。如果这两个细节无法同时可见，用户必须选择该视频里哪个细节更重要。

### 2.3 首帧 Prompt 模板

```text
Use the provided product images as exact product references.

Primary task:
Create one realistic first-frame image for later image-to-video generation.

Product lock:
Preserve the product design exactly. Do not redesign, simplify, replace, recolor, or reinterpret the product.

Category lock:
This is a wearable inflatable costume. It must not become a real animal, cartoon character, plush toy, CGI creature, or redesigned mascot. Preserve the inflated fabric, air-filled volume, wrinkles, seams, zipper or entry line, fan valve, leg openings, and foot covers or visible shoes.

Must preserve:
{{LOCKED_LANDMARKS}}

Fragile details:
{{FRAGILE_DETAILS}}

Scene:
{{SCENE_DESCRIPTION}}

Composition:
{{PREFERRED_ANGLE}}
Full product visible.
Do not crop any critical details.
Leave enough space around the product for small motion.

Style:
Realistic commercial product image, clean lighting, sharp product detail.

Avoid:
{{FORBIDDEN_CHANGES}}
No logos, no random text, no watermark, no invented accessories, no deformed product parts.
```

### 2.4 首帧审核

生成出的首帧必须先审核，再进入视频生成。

审核清单：

- 产品仍然是一件可穿戴充气服
- 产品形状与上传参考图一致
- 颜色一致
- 关键锁定点可见
- 易漂移细节位于正确位置
- 没有新增嘴、logo、配饰、图案或结构部件
- 产品没有被裁切
- 产品角度对视频生成安全
- 场景没有遮挡关键产品细节

系统应展示审核表单：

```text
首帧审核：

[ ] 产品形状正确
[ ] 颜色正确
[ ] 关键锁定点正确
[ ] 易漂移细节正确
[ ] 没有虚构部件
[ ] 产品完整可见
[ ] 该图片可以作为锁定视频首帧
```

如果任何 critical 项失败，必须重新生成或编辑首帧。不能继续进入视频生成。

## 3. 视频生成

### 3.1 视频模型职责

视频模型只负责动画化已经通过审核的首帧。

它不能：

- 重新设计产品几何结构
- 发明未知角度
- 移动易漂移细节
- 添加新产品特征
- 用吉祥物、卡通或相关物体替换产品
- 把充气服变成真实动物或生物
- 发明产品中不存在的自然生物结构，例如新牙齿、爪子、毛发、鳞片或会动的嘴部

### 3.2 动作预算

每个视频请求都应该选择一个动作预算。

高一致性模式，产品视频默认模式：

- 身体旋转：0-8 度
- 小幅弹动
- 手/鳍/胳膊小幅动作
- 极小的一步位移
- 不进行大范围行走
- 不旋转、不跳跃、不快速跳舞、不转身
- 除非背面图已经明确通过并被认为安全，否则不展示完整背面

平衡模式：

- 身体旋转最多 15 度
- 小范围行走
- 温和手势
- 可以有一些场景互动

创意模式：

- 动作更大
- 产品漂移风险更高
- 仅在用户接受较低货对版保障时使用

### 3.3 视频 Prompt 模板

```text
Use the provided image as the locked first frame and exact product design.
The first frame is already approved and correct.
Generate motion by animating this same product, not by redesigning or reinterpreting it.

STRICT PRODUCT LOCK:
The product must remain identical to the first frame in every frame.
Preserve the exact shape, position, scale, and appearance of:
{{LOCKED_LANDMARKS}}

CATEGORY LOCK:
This is a wearable inflatable costume, not a real animal, cartoon character, plush toy, CGI creature, or redesigned mascot. Preserve inflated fabric, wrinkles, seams, zipper or entry line, fan valve, leg openings, foot covers or visible shoes, and air-filled body volume.

FRAGILE DETAIL LOCK:
{{FRAGILE_DETAIL_RULES}}

SCENE:
{{VIDEO_SCENE}}

MOTION:
{{MOTION_BUDGET}}
Keep movement small and controlled.
Do not reveal unseen angles.

CAMERA:
{{CAMERA_RULES}}

AUDIO:
{{AUDIO_RULES}}

NEGATIVE:
{{NEGATIVE_PROMPT}}
```

### 3.4 场景复杂度规则

如果产品准确性非常关键：

- 优先使用稳定镜头
- 优先使用全身或完整产品构图
- 优先使用小手势
- 优先使用简单场景互动
- 避免转场剪切
- 避免快速镜头运动
- 避免完整旋转
- 避免人物、道具、烟雾、水花或强光效遮挡产品

如果目标场景和首帧差异很大，需要额外谨慎。背景大幅变化可能导致模型重新绘制产品。

### 3.5 视频审核

生成后，至少审核五个时间点的画面：

- 开始
- 25%
- 50%
- 75%
- 结束

视频通过清单：

- 产品仍然是可穿戴充气服
- 产品在所有审核帧里保持一致
- 关键锁定点保持固定
- 易漂移细节没有移动、消失、复制或缩放
- 产品没有变成卡通、吉祥物或不同物体
- 没有新增嘴、牙齿、logo、配饰或图案
- 动作足够有趣
- 场景可以接受
- 没有严重裁切、模糊或变形

建议评分：

```text
货对版评分：0-100，必须至少 90
动作趣味评分：0-100，目标至少 70
场景丰富度评分：0-100，目标至少 60
时长：仅作为信息，不作为优先指标
```

如果货对版低于阈值，重试必须降低创意自由度：

- 降低旋转幅度
- 减少动作
- 简化场景
- 使用更静态的镜头
- 必要时缩短时长
- 加强易漂移细节锁定

## 4. 重试策略

### 4.1 产品漂移

表现：

- 产品形状变化
- 易漂移细节移动
- 背鳍、尾巴、把手或开口出错
- 充气服变成真实动物、卡通、毛绒玩具或吉祥物
- 出现自然生物结构，例如新牙齿、爪子、毛发、鳞片或会动的嘴部

重试：

- 使用高一致性动作预算
- 保持同一个可见角度
- 加入 "do not reveal unseen angles"
- 将身体旋转降到 5-8 度

### 4.2 细节漂移

表现：

- 鼓风机移动
- 透明窗口变成嘴或 logo
- 印刷图案变化
- 露脸开口形状变化，或在不应该露脸时露出人脸
- 尾巴、鳍、鬃毛、角、耳朵或脊刺复制、融化或变形

重试：

- 将易漂移细节锁定前置到 prompt 更高位置
- 描述准确位置和禁止解释
- 要求该细节全程可见

### 4.3 场景失败

表现：

- 场景没有变化
- 场景遮挡产品
- 场景压过产品主体

重试：

- 保持产品锁定不变
- 更简单地重写场景
- 避免过多道具
- 使用 "background changes, product remains locked"

### 4.4 动作失败

表现：

- 动作太无聊
- 动作太夸张
- 产品在动作中变形

重试：

- 只添加一个明确的小动作
- 删除复杂动作序列
- 让动作贴近原始姿势

## 5. 产品实现说明

未来网页产品模块：

1. 上传模块
2. Product Lock Card 编辑器
3. 用户确认步骤
4. 首帧生成器
5. 首帧审核 UI
6. 视频 prompt 构建器
7. 视频生成器
8. 抽帧和质量审核
9. 重试控制器
10. 最终导出

重要产品行为：

- 永远不要只把上传的产品图当成装饰性参考。
- 始终把产品图转换成明确锁定点。
- 始终要求用户确认锁定点。
- 始终要求首帧审核通过后再进入视频生成。
- 始终在标记视频成功之前审核生成结果。
- 始终把货对版放在时长之前。


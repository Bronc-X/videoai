import { existsSync, readFileSync } from "node:fs";

const serverSource = readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const workflowZhSource = readFileSync(new URL("../docs/product-video-workflow.zh-CN.md", import.meta.url), "utf8");
const workflowEnSource = readFileSync(new URL("../docs/product-video-workflow.md", import.meta.url), "utf8");
const normalizedAppSource = appSource.replace(/\r\n/g, "\n");

const productPresetFiles = {
  shark: [
    "../public/product-presets/shark-inflatable/front.png",
    "../public/product-presets/shark-inflatable/left.png",
    "../public/product-presets/shark-inflatable/right.png",
    "../public/product-presets/shark-inflatable/back.jpg",
    "../public/product-presets/shark-inflatable/reference-01.mp4",
    "../public/product-presets/shark-inflatable/reference-02.mp4",
  ],
  bull: [
    "../public/product-presets/bull-inflatable/front.jpg",
    "../public/product-presets/bull-inflatable/left.jpg",
    "../public/product-presets/bull-inflatable/right.jpg",
    "../public/product-presets/bull-inflatable/back.jpg",
    "../public/product-presets/bull-inflatable/reference-01.mp4",
  ],
  grayMouse: [
    "../public/product-presets/gray-mouse-inflatable/front.jpg",
    "../public/product-presets/gray-mouse-inflatable/left.jpg",
    "../public/product-presets/gray-mouse-inflatable/right.jpg",
    "../public/product-presets/gray-mouse-inflatable/back.jpg",
  ],
  frog: [
    "../public/product-presets/frog-inflatable/front.jpg",
    "../public/product-presets/frog-inflatable/left.jpg",
    "../public/product-presets/frog-inflatable/right.jpg",
    "../public/product-presets/frog-inflatable/back.jpg",
    "../public/product-presets/frog-inflatable/support-right-alt.jpg",
  ],
  sumo: [
    "../public/product-presets/sumo-inflatable/front.jpg",
    "../public/product-presets/sumo-inflatable/left.jpg",
    "../public/product-presets/sumo-inflatable/right.jpg",
    "../public/product-presets/sumo-inflatable/back.jpg",
    "../public/product-presets/sumo-inflatable/support-rear-valve.jpg",
  ],
};

const allPresetFiles = Object.values(productPresetFiles)
  .flat()
  .map((path) => new URL(path, import.meta.url));

const checks = [
  {
    name: "all five long-term product presets exist on disk",
    pass: allPresetFiles.every((file) => existsSync(file)),
  },
  {
    name: "frontend product library contains the five real products",
    pass:
      appSource.includes("SHARK_INFLATABLE_PRESET_VIEWS") &&
      appSource.includes("BULL_INFLATABLE_PRESET_VIEWS") &&
      appSource.includes("GRAY_MOUSE_INFLATABLE_PRESET_VIEWS") &&
      appSource.includes("FROG_INFLATABLE_PRESET_VIEWS") &&
      appSource.includes("SUMO_INFLATABLE_PRESET_VIEWS") &&
      appSource.includes("PRODUCT_GRAY_MOUSE_001") &&
      appSource.includes("PRODUCT_FROG_001") &&
      appSource.includes("PRODUCT_SUMO_001") &&
      appSource.includes("灰色老鼠充气服") &&
      appSource.includes("青蛙充气服") &&
      appSource.includes("相扑充气服") &&
      !appSource.includes("霸王龙充气服") &&
      !appSource.includes("狮子充气服"),
  },
  {
    name: "user-facing detail-image upload has been removed",
    pass:
      !appSource.includes("initialDetailSlots") &&
      !appSource.includes("detailSlots") &&
      !appSource.includes("detailViews") &&
      !appSource.includes("detail_image_urls") &&
      !appSource.includes("细节补充") &&
      !styleSource.includes("detail-asset-grid") &&
      !styleSource.includes("detail-card") &&
      !styleSource.includes("detail-review-pane"),
  },
  {
    name: "preset auxiliary views are internal support evidence",
    pass:
      appSource.includes("supportViews") &&
      appSource.includes("loadPresetSupportDataUrls") &&
      appSource.includes("supportImageUrls") &&
      appSource.includes("support_image_urls: supportImageUrls") &&
      appSource.includes("FROG_INFLATABLE_SUPPORT_VIEWS") &&
      appSource.includes("SUMO_INFLATABLE_SUPPORT_VIEWS") &&
      serverSource.includes("support_image_urls") &&
      serverSource.includes("Preset auxiliary support view") &&
      serverSource.includes("same-product support evidence only"),
  },
  {
    name: "dice buttons call the connected prompt model",
    pass:
      appSource.includes("Dices") &&
      appSource.includes("prompt-label-row") &&
      appSource.includes("dice-action") &&
      appSource.includes("requestPromptSuggestion") &&
      appSource.includes("scene_prompt: scenePrompt") &&
      appSource.includes('fetch("/api/prompt-suggestion"') &&
      appSource.includes("promptModel") &&
      serverSource.includes("/api/prompt-suggestion") &&
      serverSource.includes("proxyPromptSuggestion") &&
      serverSource.includes("buildPromptSuggestionPayload") &&
      serverSource.includes("只输出一段中文提示词"),
  },
  {
    name: "image and prompt API credentials are backend-fixed, not user-entered",
    pass:
      !appSource.includes("imageBaseUrl: string") &&
      !appSource.includes("imageApiKey: string") &&
      !appSource.includes("apiSettings.imageBaseUrl") &&
      !appSource.includes("apiSettings.imageApiKey") &&
      !appSource.includes("图片 API Key") &&
      !appSource.includes("image-api-url") &&
      !appSource.includes("image-api-token") &&
      appSource.includes("delete parsed.imageBaseUrl") &&
      appSource.includes("delete parsed.imageApiKey") &&
      appSource.includes("api-fixed-note") &&
      appSource.includes("后台固定配置") &&
      serverSource.includes("loadLocalEnv") &&
      serverSource.includes(".env.local") &&
      serverSource.includes("IMAGE_TEXT_BASE_URL") &&
      serverSource.includes("IMAGE_TEXT_API_KEY") &&
      serverSource.includes('kind === "image" || kind === "prompt"') &&
      serverSource.includes("normalizeUpstreamModel") &&
      serverSource.includes('const DEFAULT_IMAGE_MODEL = "gpt-image-2"') &&
      serverSource.includes('const DEFAULT_PROMPT_MODEL = "gpt-5.4-mini"'),
  },
  {
    name: "video API defaults to Wisech Seedance backend configuration",
    pass:
      serverSource.includes("VIDEO_BASE_URL") &&
      serverSource.includes("VIDEO_API_KEY") &&
      serverSource.includes("VIDEO_MODEL") &&
      serverSource.includes("OPENAI_VIDEO_GENERATIONS_PATH") &&
      serverSource.includes('const OPENAI_VIDEO_GENERATIONS_PATH = "/video/generations"') &&
      serverSource.includes("proxyJson(OPENAI_VIDEO_GENERATIONS_PATH, buildVideoPayload(body), \"video\")") &&
      serverSource.includes("buildOpenAICompatibleVideoPayload") &&
      serverSource.includes("getVideoFirstFrameUrl") &&
      serverSource.includes("image_with_roles") &&
      serverSource.includes('role: "first_frame"') &&
      serverSource.includes("metadata") &&
      serverSource.includes("image_urls: [firstFrameUrl]") &&
      serverSource.includes("视频生成必须提交已确认首帧 image_url") &&
      serverSource.includes("hasVideoApiKey") &&
      appSource.includes('videoBaseUrl: "https://ai.wisech.com/v1"') &&
      appSource.includes('const DEFAULT_VIDEO_MODEL = "doubao-seedance-2-0-260128"') &&
      appSource.includes("doubao-seedance-1-5-pro-251215") &&
      appSource.includes("doubao-seedance-2-0-260128") &&
      appSource.includes("VIDEO_MODEL_OPTIONS") &&
      appSource.includes("<select value={props.apiSettings.videoModel}") &&
      appSource.includes("后台已配置，留空即可"),
  },
  {
    name: "backend product locks cover all five products",
    pass:
      serverSource.includes('return "cow"') &&
      serverSource.includes('return "shark"') &&
      serverSource.includes('return "mouse"') &&
      serverSource.includes('return "frog"') &&
      serverSource.includes('return "sumo"') &&
      serverSource.includes("MANDATORY GRAY MOUSE INFLATABLE COSTUME VISUAL LOCKS") &&
      serverSource.includes("MANDATORY FROG INFLATABLE COSTUME VISUAL LOCKS") &&
      serverSource.includes("MANDATORY SUMO INFLATABLE COSTUME VISUAL LOCKS") &&
      serverSource.includes("MANDATORY GRAY MOUSE INFLATABLE COSTUME VIDEO LOCKS") &&
      serverSource.includes("MANDATORY FROG INFLATABLE COSTUME VIDEO LOCKS") &&
      serverSource.includes("MANDATORY SUMO INFLATABLE COSTUME VIDEO LOCKS"),
  },
  {
    name: "material and air-hardware locks are applied everywhere",
    pass:
      serverSource.includes("buildInflatableHardwareMaterialLocks") &&
      serverSource.includes("MATERIAL AND AIR-HARDWARE HARD LOCK") &&
      serverSource.includes("air inlet") &&
      serverSource.includes("air outlet") &&
      serverSource.includes("pump port") &&
      serverSource.includes("inflation/deflation ports") &&
      serverSource.includes("SHARK AIR-HARDWARE MAP") &&
      serverSource.includes("COW AIR-HARDWARE MAP") &&
      serverSource.includes("MOUSE AIR-HARDWARE MAP") &&
      serverSource.includes("FROG AIR-HARDWARE MAP") &&
      serverSource.includes("SUMO AIR-HARDWARE MAP") &&
      serverSource.includes("...buildInflatableHardwareMaterialLocks(productType)") &&
      serverSource.includes("buildPromptSuggestionHardwareMustMention") &&
      appSource.includes("getAirHardwareMaterialLockNodes") &&
      appSource.includes("Air_Hardware_Pump_Port_Placement") &&
      appSource.includes("Inflatable_Material_Wrinkle_Zipper_Detail") &&
      appSource.includes("air-hardware-material") &&
      appSource.includes("进出气口泵口 / 材质细节正确"),
  },
  {
    name: "video generation preserves the approved first frame instead of quality-redrawing it",
    pass:
      serverSource.includes("buildVideoFirstFramePixelAnchorLocks") &&
      serverSource.includes("APPROVED FIRST-FRAME PIXEL ANCHOR LOCK") &&
      serverSource.includes("not a loose style reference") &&
      serverSource.includes("FRAME 1 EXACT START RULE") &&
      serverSource.includes("HANDHELD PROP SAFETY RULE") &&
      serverSource.includes("POSE AND CONTACT LOCK") &&
      serverSource.includes("Quality rule") &&
      serverSource.includes("ACTION OBJECT GUARDRAIL") &&
      serverSource.includes("VIDEO QUALITY GUARDRAIL") &&
      serverSource.includes("no quality-upscale redraw") &&
      serverSource.includes("GRAY MOUSE VIDEO ANCHOR") &&
      serverSource.includes("GRAY MOUSE HARD FAIL DETAILS") &&
      serverSource.includes("FROG VIDEO ANCHOR") &&
      serverSource.includes("FROG HARD FAIL DETAILS") &&
      serverSource.includes("Handheld props are allowed") &&
      serverSource.includes("must not replace the face window") &&
      serverSource.includes("large black curved mouth band") &&
      serverSource.includes("SHARK HARD FAIL DETAILS") &&
      serverSource.includes("COW HARD FAIL DETAILS") &&
      serverSource.includes("SUMO HARD FAIL DETAILS") &&
      serverSource.includes("buildVideoFirstFramePixelAnchorLocks(productType)") &&
      appSource.includes("首帧就是像素级身份锚点") &&
      appSource.includes("不允许高清重绘") &&
      appSource.includes("允许为了动作和喜剧效果出现手持道具") &&
      appSource.includes("道具只能作为外部剧情道具") &&
      appSource.includes("可见真人手/鞋") &&
      appSource.includes("大块黑色弧形嘴带") &&
      appSource.includes("双手重排抱袋") &&
      appSource.includes("如果首帧是一只手拿零食袋、另一只手伸向货架"),
  },
  {
    name: "video prompt dice generates lively humorous motion while preserving product locks",
    pass:
      serverSource.includes("灵动、幽默、略搞怪") &&
      serverSource.includes("明显戏剧节奏") &&
      serverSource.includes("2-3 个节拍的小短剧") &&
      serverSource.includes("允许一个较明显但产品安全的大动作") &&
      serverSource.includes("不能只是站着不动") &&
      serverSource.includes("戏剧性来自场景反差") &&
      serverSource.includes("输出开头必须是当前首帧场景动作") &&
      serverSource.includes("当前首帧场景上下文") &&
      serverSource.includes("不要让整段变成阀门、拉链、材质的清单") &&
      serverSource.includes("严禁更换首帧场景类型") &&
      serverSource.includes("SCENE ANCHOR") &&
      serverSource.includes("至少两个原有道具词") &&
      serverSource.includes("必须点名当前产品") &&
      serverSource.includes("getProductStableName") &&
      serverSource.includes("stable product name") &&
      serverSource.includes("不要换场景，不要换产品名") &&
      serverSource.includes("不要把原场景替换成相似场景") &&
      serverSource.includes("sanitizeVideoPromptText") &&
      serverSource.includes("可以写手持杯子、袋子、工具、标牌") &&
      serverSource.includes("不能变成产品新增组件") &&
      serverSource.includes("InputTextSensitiveContentDetected") === false &&
      serverSource.includes("避免偷、被发现、推、撞、吓、攻击、摔倒、危险、求助"),
  },
  {
    name: "OpenAI-compatible image edits are sent as multipart references",
    pass:
      serverSource.includes("buildOpenAIImageEditFormData") &&
      serverSource.includes('form.append("image"') &&
      serverSource.includes("sendMultipartImageEdit") &&
      serverSource.includes("data:image/") &&
      serverSource.includes("Only data:image/ or http(s) image inputs are supported"),
  },
  {
    name: "four-view workflow still gates first frame and video generation",
    pass:
      appSource.includes('type StepId = "upload" | "firstFrame" | "video" | "qa"') &&
      appSource.includes("requiredUrls = slots.map(getSlotImageUrl).filter(Boolean)") &&
      appSource.includes("uploadReady = requiredUrls.length === slots.length") &&
      appSource.includes("firstFrameReady = uploadReady && allLocksConfirmed") &&
      appSource.includes("videoReady = firstFrameReady && Boolean(approvedFirstFrameUrl.trim()) && firstFrameApproved") &&
      serverSource.includes("validateFourViewImages") &&
      serverSource.includes("need exactly four readable core product view images") &&
      serverSource.includes("CORE_VIEW_INPUT_ORDER") &&
      serverSource.includes("FOUR-VIEW REFERENCES ARE TOPOLOGY MAPS"),
  },
  {
    name: "video prompt edits do not invalidate approved first frame",
    pass:
      appSource.includes("function invalidateVideoOutputs()") &&
      appSource.includes("function updateVideoActionPrompt") &&
      normalizedAppSource.includes("invalidateVideoOutputs();\n    setVideoActionPrompt(value);") &&
      appSource.includes("setApprovedFirstFrameUrl(\"\")") &&
      appSource.includes("function invalidateGeneratedOutputs()"),
  },
  {
    name: "workflow docs match no-detail-upload preset-support contract",
    pass:
      !workflowZhSource.includes("detail_image_urls") &&
      !workflowEnSource.includes("detail_image_urls") &&
      workflowZhSource.includes("五个可穿戴充气服：鲨鱼、奶牛、灰色老鼠、青蛙、相扑") &&
      workflowZhSource.includes("用户界面不提供细节图上传入口") &&
      workflowZhSource.includes("support_image_urls") &&
      workflowEnSource.includes("Users no longer upload detail images") &&
      workflowEnSource.includes("No user-facing detail-image upload is exposed") &&
      workflowEnSource.includes("support_image_urls"),
  },
  {
    name: "API settings are cached locally including the prompt model",
    pass:
      appSource.includes("videoai.apiSettings") &&
      appSource.includes("window.localStorage.setItem") &&
      appSource.includes("loadApiSettings") &&
      appSource.includes('const DEFAULT_PROMPT_MODEL = "gpt-5.4-mini"') &&
      appSource.includes('const DEFAULT_IMAGE_MODEL = "gpt-image-2"') &&
      appSource.includes("merged.imagePath") &&
      appSource.includes("merged.videoPath"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length > 0) {
  console.error(`\nBaseline failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log("\nBaseline passed.");

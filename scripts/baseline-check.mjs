import { readFileSync } from "node:fs";

const serverSource = readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const workflowZhSource = readFileSync(new URL("../docs/product-video-workflow.zh-CN.md", import.meta.url), "utf8");
const workflowEnSource = readFileSync(new URL("../docs/product-video-workflow.md", import.meta.url), "utf8");

const checks = [
  {
    name: "backend accepts API settings and path from the UI",
    pass:
      serverSource.includes("const { base_url, api_key, path, ...upstreamPayload } = body") &&
      serverSource.includes("pathText") &&
      serverSource.includes("upstreamUrl"),
  },
  {
    name: "backend exposes image and video API tests",
    pass:
      serverSource.includes("/api/test-image") &&
      serverSource.includes("/api/test-video") &&
      serverSource.includes("testProxy"),
  },
  {
    name: "backend hides raw Cloudflare timeout HTML",
    pass:
      serverSource.includes("UPSTREAM_TIMEOUT_524") &&
      serverSource.includes("上游接口处理超时"),
  },
  {
    name: "API settings are cached locally",
    pass:
      appSource.includes("videoai.apiSettings") &&
      appSource.includes("window.localStorage.setItem") &&
      appSource.includes("loadApiSettings") &&
      appSource.includes('merged.imagePath === "/images/generations"'),
  },
  {
    name: "workflow docs define four-view product-consistency-first logic",
    pass:
      workflowZhSource.includes("上传四视图 -> 生成首帧 -> 生成视频 -> 视频质检") &&
      workflowZhSource.includes("定款/锁定产品细节”是系统后台自动步骤") &&
      workflowZhSource.includes("正面、左侧、右侧、背面四张核心图全部上传后") &&
      workflowZhSource.includes("细节图是可选补充") &&
      workflowZhSource.includes("四视图不是拼贴素材，也不是装饰参考") &&
      workflowZhSource.includes("如果场景很好但产品漂移，该次生成失败") &&
      workflowZhSource.includes("不再接受 `foreground_source_url`") &&
      workflowEnSource.includes("Upload four views -> Generate first frame -> Generate video -> QA video") &&
      workflowEnSource.includes("The product-lock step is internal and automatic") &&
      workflowEnSource.includes("front, left-side, right-side, and back images") &&
      workflowEnSource.includes("Detail images are optional supplements") &&
      workflowEnSource.includes("If the scene is good but the product drifts, the generation fails"),
  },
  {
    name: "upload completion enters first-frame while product lock stays internal",
    pass:
      appSource.includes("onComplete={() => completeUploadStep()}") &&
      appSource.includes("function completeUploadStep()") &&
      appSource.includes("autoLockedNodes") &&
      appSource.includes('setActiveStep("firstFrame")') &&
      !appSource.includes('activeStep === "upload" && uploadReady'),
  },
  {
    name: "visible workflow has exactly four steps with no lock route",
    pass:
      appSource.includes("visibleSteps") &&
      appSource.includes("const visibleSteps = steps") &&
      appSource.includes("{visibleSteps.map((step, index) =>") &&
      appSource.includes('type StepId = "upload" | "firstFrame" | "video" | "qa"') &&
      styleSource.includes("grid-template-columns: repeat(4, minmax(0, 1fr))") &&
      !appSource.includes('| "lock"') &&
      !appSource.includes('id: "lock"') &&
      !appSource.includes("function LockStep") &&
      !appSource.includes("后台自动定款") &&
      !appSource.includes("自动定款结果"),
  },
  {
    name: "product upload requires four core product view images with optional details",
    pass:
      appSource.includes('id: "front"') &&
      appSource.includes('label: "正面图"') &&
      appSource.includes('id: "leftSide"') &&
      appSource.includes('label: "左侧图"') &&
      appSource.includes('id: "rightSide"') &&
      appSource.includes('label: "右侧图"') &&
      appSource.includes('id: "back"') &&
      appSource.includes('label: "背面图"') &&
      appSource.includes("initialDetailSlots") &&
      appSource.includes('id: "detail"') &&
      appSource.includes('label: "细节补充图"') &&
      appSource.includes("细节图是可选补充") &&
      appSource.includes("素材上传完成") &&
      appSource.includes("核心四视图上传后") &&
      appSource.includes("requiredUrls = slots.map(getSlotImageUrl).filter(Boolean)") &&
      appSource.includes("detailUrls = detailSlots.map(getSlotImageUrl).filter(Boolean)") &&
      appSource.includes("uploadReady = requiredUrls.length === slots.length") &&
      appSource.includes('accept: "image/*"') &&
      appSource.includes("accept={slot.accept}") &&
      appSource.includes('viewMode: "四视图"') &&
      !appSource.includes('id: "side"') &&
      !appSource.includes('"三视图"') &&
      !appSource.includes('id: "source"') &&
      !appSource.includes("primaryProductSourceUrl") &&
      !appSource.includes("source-asset-card"),
  },
  {
    name: "four uploaded view images are converted to model-readable inputs",
    pass:
      appSource.includes("await readFileAsDataUrl(file)") &&
      appSource.includes("getSlotImageUrl") &&
      appSource.includes("image_urls: requiredUrls") &&
      appSource.includes("detail_image_urls: detailUrls") &&
      !appSource.includes("primaryProductSourceUrl") &&
      !appSource.includes("foreground_source_url") &&
      !appSource.includes("audit_image_urls") &&
      !appSource.includes("参考图 URL") &&
      serverSource.includes("validateFourViewImages") &&
      serverSource.includes("need exactly four readable core product view images") &&
      serverSource.includes("detail_image_urls") &&
      serverSource.includes("不接受 foreground_source_url") &&
      serverSource.includes("blob:") &&
      serverSource.includes("data:image/"),
  },
  {
    name: "product changes invalidate generated first frame and video state",
    pass:
      appSource.includes("function invalidateGeneratedOutputs()") &&
      appSource.includes("setApprovedFirstFrameUrl(\"\")") &&
      appSource.includes("setFirstFrameApproved(false)") &&
      appSource.includes("setVideoStatus(\"idle\")") &&
      appSource.includes("setVideoUrl(\"\")") &&
      appSource.includes("invalidateGeneratedOutputs();\n    setActiveStep(\"upload\")") &&
      appSource.includes("function updateScenePrompt") &&
      appSource.includes("function updateAspectRatio"),
  },
  {
    name: "timeline prevents skipping gated workflow steps",
    pass:
      appSource.includes("function selectStep(step: StepId)") &&
      appSource.includes('if (step === "firstFrame" && uploadReady)') &&
      appSource.includes('if (step === "video" && videoReady)') &&
      appSource.includes('if (step === "qa" && Boolean(videoUrl))') &&
      appSource.includes("canEnterFirstFrame") &&
      appSource.includes("canEnterVideo") &&
      appSource.includes("canEnterQa") &&
      appSource.includes('aria-disabled={isLocked}') &&
      styleSource.includes(".timeline-step.locked"),
  },
  {
    name: "generation paths stay hidden in the backend",
    pass:
      !appSource.includes("path: apiSettings.imagePath") &&
      !appSource.includes("path: apiSettings.videoPath") &&
      appSource.includes('imagePath: ""') &&
      appSource.includes('videoPath: ""') &&
      !appSource.includes("图片路径") &&
      !appSource.includes("视频路径") &&
      serverSource.includes('proxyJson("/images/generations", buildFirstFramePayload(body), "image")') &&
      serverSource.includes('proxyJson("/responses", buildVideoPayload(body), "video")'),
  },
  {
    name: "first-frame uses four-view product lock workflow",
    pass:
      appSource.includes("scene_prompt: scenePrompt") &&
      appSource.includes("locked_nodes: lockNodes.map") &&
      appSource.includes("image_urls: requiredUrls") &&
      appSource.includes("detail_image_urls: detailUrls") &&
      appSource.includes("firstFrameReady = uploadReady && allLocksConfirmed") &&
      appSource.includes("首帧不过审，不进入视频") &&
      !appSource.includes("prompt: firstFramePrompt") &&
      serverSource.includes("HIGHEST PRIORITY FOUR-VIEW PRODUCT FIRST-FRAME CONTRACT") &&
      serverSource.includes("front view, left-side view, right-side view, and back view") &&
      serverSource.includes("Optional detail supplement images") &&
      serverSource.includes("Do not average the core views into a new product") &&
      serverSource.includes("image_urls: [...readableImages, ...readableDetailImages]") &&
      serverSource.includes("If the scene conflicts with product fidelity, simplify the scene") &&
      serverSource.includes("LOWER PRIORITY SCENE ONLY") &&
      serverSource.includes("buildFirstFramePayload(body)"),
  },
  {
    name: "first-frame references are bound to explicit view roles",
    pass:
      serverSource.includes("CORE_VIEW_INPUT_ORDER") &&
      serverSource.includes("image_urls[0] = FRONT_VIEW") &&
      serverSource.includes("image_urls[1] = LEFT_SIDE_VIEW") &&
      serverSource.includes("image_urls[2] = RIGHT_SIDE_VIEW") &&
      serverSource.includes("image_urls[3] = BACK_VIEW") &&
      serverSource.includes("Core reference 1 FRONT_VIEW") &&
      serverSource.includes("Optional detail supplement") &&
      !serverSource.includes("imageUrls.map((image) => ({ image }))"),
  },
  {
    name: "first-frame prompt resolves visibility conflicts instead of forcing hidden details",
    pass:
      serverSource.includes("Do not force hidden side or rear details into a front-facing frame") &&
      serverSource.includes("Visible-detail rule") &&
      serverSource.includes("side valve is optional in a front camera") &&
      serverSource.includes("rear tail fin is hidden in a front camera") &&
      !serverSource.includes("no crop of feet, tail, fan valve, or face window"),
  },
  {
    name: "user-facing URL fields are hidden from first-frame workflow",
    pass:
      !appSource.includes("已确认首帧 URL") &&
      !appSource.includes('placeholder="https://..."') &&
      !appSource.includes("setApprovedUrl: (value: string) => void") &&
      appSource.includes("setApprovedFirstFrameUrl(imageUrl)") &&
      appSource.includes("确认产品一致，批准首帧"),
  },
  {
    name: "workspace layout uses wide main canvas and compact typography",
    pass:
      styleSource.includes("grid-template-columns: 132px minmax(0, 1fr)") &&
      styleSource.includes("grid-template-columns: minmax(0, 1fr) 260px") &&
      styleSource.includes("grid-template-columns: repeat(4, minmax(0, 1fr))") &&
      styleSource.includes("font-size: 12px") &&
      !styleSource.includes("font-size: max(24px, 1em)") &&
      !styleSource.includes("font-size: 24px") &&
      !styleSource.includes("font-size: 26px") &&
      !styleSource.includes("font-size: 28px") &&
      !styleSource.includes("font-size: 30px") &&
      !styleSource.includes("font-size: 36px") &&
      !styleSource.includes("font-size: 56px") &&
      !styleSource.includes("font-size: 34px") &&
      !styleSource.includes("font-size: clamp(56px") &&
      !styleSource.includes("font-size: clamp(56px, 6vw, 72px)"),
  },
  {
    name: "video product consistency is enforced on the backend",
    pass:
      appSource.includes("action_prompt: videoActionPrompt") &&
      appSource.includes("scene_prompt: scenePrompt") &&
      appSource.includes("locked_nodes: lockNodes.map") &&
      !appSource.includes("prompt: videoPrompt") &&
      serverSource.includes("HIGHEST PRIORITY PRODUCT CONSISTENCY VIDEO CONTRACT") &&
      serverSource.includes("FOUR-VIEW PRODUCT HARD LOCK") &&
      serverSource.includes("locked dead across all frames") &&
      serverSource.includes("LOWER PRIORITY USER ACTION ONLY") &&
      serverSource.includes("buildVideoPayload(body)") &&
      serverSource.includes("buildProductVideoPrompt"),
  },
  {
    name: "video request carries four-view context and does not overclaim visual inputs",
    pass:
      appSource.includes("image_urls: requiredUrls") &&
      appSource.includes("detail_image_urls: detailUrls") &&
      serverSource.includes("const readableImages = Array.isArray(image_urls)") &&
      serverSource.includes("Approved first frame is the direct video media input") &&
      serverSource.includes("FOUR-VIEW TEXT CONTRACT") &&
      serverSource.includes("Keep the camera inside the approved first-frame view family") &&
      !serverSource.includes("The approved first frame plus the uploaded front, left-side, right-side, and back core references are the non-negotiable source of truth"),
  },
  {
    name: "first-frame approval is gated by critical review checklist",
    pass:
      appSource.includes("firstFrameReviewChecks") &&
      appSource.includes("allFirstFrameReviewChecksPassed") &&
      appSource.includes("setFirstFrameReviewState") &&
      appSource.includes("ALL_CRITICAL_FIRST_FRAME_CHECKS_REQUIRED") &&
      appSource.includes("disabled={!props.allReviewChecksPassed") &&
      appSource.includes("review-checklist") &&
      appSource.includes("onReviewCheck"),
  },
  {
    name: "first-frame review supports explicit pass and fail decisions",
    pass:
      appSource.includes('type ReviewDecision = "pending" | "pass" | "fail"') &&
      appSource.includes("failedFirstFrameReviewChecks") &&
      appSource.includes("hasFailedFirstFrameReviewChecks") &&
      appSource.includes('decision === "fail"') &&
      appSource.includes("首帧审核未通过") &&
      appSource.includes("重新生成首帧") &&
      appSource.includes("正确") &&
      appSource.includes("错误") &&
      !appSource.includes("Record<ReviewCheckId, boolean>") &&
      !appSource.includes('type="checkbox"'),
  },
  {
    name: "shark costume identity locks are explicit",
    pass:
      appSource.includes("Side_Eye_Gill_Stripes") &&
      appSource.includes("Orange_Side_Blower_Valve") &&
      appSource.includes("Back_Tail_Fin_Seam") &&
      appSource.includes("Body_Volume_Envelope") &&
      appSource.includes("View_Topology_Detail_Placement") &&
      serverSource.includes("exactly five black curved gill stripes") &&
      serverSource.includes("orange circular blower valve") &&
      serverSource.includes("horizontal transparent face window") &&
      serverSource.includes("centered blue rear tail fin"),
  },
  {
    name: "view topology prevents cross-view detail relocation",
    pass:
      serverSource.includes("VIEW TOPOLOGY LOCK") &&
      serverSource.includes("Do not merge details from different views") &&
      serverSource.includes("FOUR-VIEW REFERENCES ARE TOPOLOGY MAPS, NOT COLLAGE REQUIREMENTS") &&
      serverSource.includes("PRIMARY CAMERA IS FRONT-FACING BY DEFAULT") &&
      serverSource.includes("do not switch to side or rear unless the user explicitly asks") &&
      serverSource.includes("Choose one primary camera family before rendering") &&
      serverSource.includes("left side, right side") &&
      serverSource.includes("Visibility matrix") &&
      serverSource.includes("Do not satisfy product consistency by showing all reference details in one generated frame") &&
      serverSource.includes("rear tail fin belongs on the back centerline only") &&
      serverSource.includes("never move a rear tail fin to the side waist") &&
      serverSource.includes("detail that is not visible from the current angle must remain hidden"),
  },
  {
    name: "shape and inflation envelope is locked for image and video",
    pass:
      serverSource.includes("SHAPE AND VOLUME ENVELOPE LOCK") &&
      serverSource.includes("medium-inflated") &&
      serverSource.includes("not skinny") &&
      serverSource.includes("not overinflated") &&
      serverSource.includes("HUMAN-SCALE SIZE LOCK") &&
      serverSource.includes("not a giant mascot shell") &&
      serverSource.includes("must stay close to the wearer's body scale") &&
      serverSource.includes("head height and body width must not grow beyond the references") &&
      serverSource.includes("four-view silhouette") &&
      serverSource.includes("45%-55%") &&
      serverSource.includes("Wrinkle density is a fidelity marker") &&
      serverSource.includes("No swelling, shrinking, melting, stretching, or smoothing across frames"),
  },
  {
    name: "DashScope HappyHorse video endpoint is supported",
    pass:
      appSource.includes("happyhorse-1.0-i2v") &&
      appSource.includes("dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis") &&
      appSource.includes('"https://dashscope.aliyuncs.com/api/v1"') &&
      serverSource.includes("DASHSCOPE_VIDEO_SYNTHESIS_PATH") &&
      serverSource.includes("cleanEndpointText") &&
      serverSource.includes("X-DashScope-Async") &&
      serverSource.includes("buildDashScopeVideoPayload") &&
      serverSource.includes('type: "first_frame"') &&
      serverSource.includes("media") &&
      serverSource.includes("watermark: false"),
  },
  {
    name: "first frame stays reviewable before manual video step",
    pass:
      appSource.includes("进入视频生成") &&
      appSource.includes("onNext={() => setActiveStep(\"video\")}") &&
      !appSource.includes('activeStep === "firstFrame" && videoReady'),
  },
  {
    name: "video prompt is user editable and technical prompt stays internal",
    pass:
      appSource.includes("videoActionPrompt") &&
      appSource.includes("视频动作描述") &&
      appSource.includes("setPrompt={setVideoActionPrompt}") &&
      !appSource.includes("<textarea value={props.prompt} readOnly />"),
  },
  {
    name: "light backend has planned product asset library",
    pass:
      appSource.includes("type ProductAsset") &&
      appSource.includes("viewMode") &&
      appSource.includes("viewUrls") &&
      appSource.includes("lockedNodeCodes") &&
      appSource.includes("productAssetPlan") &&
      appSource.includes("PRODUCT_SHARK_001") &&
      appSource.includes("product-library-plan"),
  },
  {
    name: "DashScope image models are not forced into video async mode",
    pass:
      serverSource.includes("DASHSCOPE_IMAGE_GENERATION_PATH") &&
      serverSource.includes("buildDashScopeImagePayload") &&
      serverSource.includes("buildLabeledImageContent(imageUrls)") &&
      serverSource.includes('kind === "video" ? buildDashScopeVideoPayload(upstreamPayload) : buildDashScopeImagePayload(upstreamPayload)') &&
      serverSource.includes('isDashScopeUrl(upstreamUrl) && kind === "video"') &&
      appSource.includes("findUrlByKey(record.output"),
  },
  {
    name: "video generation polls async tasks and renders results",
    pass:
      serverSource.includes("/api/video-status") &&
      serverSource.includes("buildDashScopeTaskUrl") &&
      serverSource.includes("/tasks/") &&
      appSource.includes("videoTaskId") &&
      appSource.includes("extractVideoUrl") &&
      appSource.includes("setVideoStatus(\"polling\")") &&
      appSource.includes("<video controls playsInline"),
  },
  {
    name: "Volcengine Ark Seedance video tasks are supported",
    pass:
      serverSource.includes("VOLCENGINE_VIDEO_TASKS_PATH") &&
      serverSource.includes("buildVolcengineVideoPayload") &&
      serverSource.includes("buildVolcengineTaskUrl") &&
      serverSource.includes('type: "image_url"') &&
      !serverSource.includes("reference_image") &&
      serverSource.includes("contents/generations/tasks") &&
      appSource.includes("record.id_str") &&
      appSource.includes("content_url"),
  },
  {
    name: "API fields disable browser autofill",
    pass:
      appSource.includes('autoComplete="off"') &&
      appSource.includes('autoComplete="new-password"') &&
      appSource.includes('name="image-api-url"') &&
      appSource.includes('name="image-api-token"'),
  },
  {
    name: "right API status panel was removed",
    pass: !appSource.includes("function ApiPanel") && !appSource.includes("接口状态"),
  },
  {
    name: "images render without cropping",
    pass:
      styleSource.includes("object-fit: contain") &&
      styleSource.includes(".preview-image"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}

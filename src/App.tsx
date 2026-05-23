import {
  Check,
  ClipboardCheck,
  CloudUpload,
  Database,
  FileImage,
  Film,
  Image,
  KeyRound,
  LoaderCircle,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type StepId = "upload" | "firstFrame" | "video" | "qa";
type MotionMode = "strict" | "balanced" | "creative";
type VideoStatus = "idle" | "submitted" | "polling" | "succeeded" | "failed";

type UploadSlot = {
  id: string;
  label: string;
  badge: string;
  hint: string;
  accept: string;
  fileName: string;
  localUrl: string;
  dataUrl?: string;
  file?: File;
};

type LockNode = {
  id: string;
  label: string;
  code: string;
  detail: string;
  confidence: number;
  critical: boolean;
  confirmed: boolean;
};

type ApiSettings = {
  imageBaseUrl: string;
  imagePath: string;
  imageApiKey: string;
  imageModel: string;
  videoBaseUrl: string;
  videoPath: string;
  videoApiKey: string;
  videoModel: string;
};

type HistoryItem = {
  id: string;
  type: "首帧" | "视频";
  title: string;
  time: string;
  status: "成功" | "失败" | "处理中";
};

type ProductAsset = {
  id: string;
  name: string;
  type: string;
  viewMode: "四视图";
  viewUrls: string[];
  lockedNodeCodes: string[];
  updatedAt: string;
};

const STORAGE_KEY = "videoai.apiSettings";

const steps: Array<{ id: StepId; label: string; shortLabel: string; description: string; icon: LucideIcon }> = [
  { id: "upload", label: "上传产品四视图", shortLabel: "上传", description: "正面、左侧、右侧、背面四张核心图", icon: Upload },
  { id: "firstFrame", label: "合成首帧", shortLabel: "首帧", description: "根据核心四视图生成一致首帧", icon: Image },
  { id: "video", label: "生成视频", shortLabel: "视频", description: "基于人工确认首帧提交视频任务", icon: Film },
  { id: "qa", label: "视频质检", shortLabel: "质检", description: "播放成片并检查产品一致性", icon: ClipboardCheck },
];
const visibleSteps = steps;

const initialSlots: UploadSlot[] = [
  { id: "front", label: "正面图", badge: "FRONT", hint: "白肚、透明脸窗、拉链、脚部比例", accept: "image/*", fileName: "", localUrl: "" },
  { id: "leftSide", label: "左侧图", badge: "LEFT", hint: "左侧厚度、眼睛/鳃线、阀门可见性", accept: "image/*", fileName: "", localUrl: "" },
  { id: "rightSide", label: "右侧图", badge: "RIGHT", hint: "右侧厚度、阀门方向、侧鳍和侧缝", accept: "image/*", fileName: "", localUrl: "" },
  { id: "back", label: "背面图", badge: "BACK", hint: "纯蓝背部、中轴尾鳍、背部竖缝", accept: "image/*", fileName: "", localUrl: "" },
];

const initialDetailSlots: UploadSlot[] = [
  { id: "detail", label: "细节补充图", badge: "DETAIL", hint: "可选：阀门、脸窗、拉链、缝线、褶皱或材质近景", accept: "image/*", fileName: "", localUrl: "" },
];

const initialNodes: LockNode[] = [
  {
    id: "front-window-zipper",
    label: "正面透明脸窗 / 中线拉链",
    code: "Front_Window_Zipper",
    detail: "保留白色腹部上的横向透明脸窗、透明反光材质、脸窗下方垂直拉链和中轴缝线。",
    confidence: 0.98,
    critical: true,
    confirmed: true,
  },
  {
    id: "side-eye-gills",
    label: "侧面黑眼睛 / 黑色鳃线",
    code: "Side_Eye_Gill_Stripes",
    detail: "侧面必须保留 1 个黑色圆眼和 5 条黑色弧形鳃线，不能省略、变淡、变形或移动位置。",
    confidence: 0.85,
    critical: true,
    confirmed: true,
  },
  {
    id: "orange-valve-side",
    label: "侧边橙色鼓风阀",
    code: "Orange_Side_Blower_Valve",
    detail: "保留侧腰橙色圆形鼓风阀、橙色环、圆形网格和所在高度，不能被手臂或场景遮掉。",
    confidence: 0.92,
    critical: true,
    confirmed: true,
  },
  {
    id: "tail-fin-back-seam",
    label: "背部尾鳍 / 背部竖缝",
    code: "Back_Tail_Fin_Seam",
    detail: "尾鳍只能位于背部中轴线，不能移动到侧腰、正面白肚或画面可见侧面；保留背部竖向缝线、后背纯蓝色块和底部黑色鞋底露出。",
    confidence: 0.9,
    critical: true,
    confirmed: true,
  },
  {
    id: "view-topology",
    label: "视角拓扑 / 细节归位",
    code: "View_Topology_Detail_Placement",
    detail: "正面白肚、透明窗、拉链只属于正面；黑眼睛、5 条鳃线、橙色阀门只属于侧面；背部尾鳍只属于背面。看不见的细节应隐藏，不能挪到错误位置。",
    confidence: 0.97,
    critical: true,
    confirmed: true,
  },
  {
    id: "fabric-color-silhouette",
    label: "蓝白色块 / 中等充气轮廓",
    code: "Moderate_Inflation_Silhouette",
    detail: "锁定四视图共同的中等充气体型：不能变瘦弱布套，也不能过度鼓成圆球；保留上宽下收、圆顶鲨鱼头、厚实躯干、分腿裤脚和黑鞋露出。",
    confidence: 0.95,
    critical: true,
    confirmed: true,
  },
  {
    id: "body-volume-envelope",
    label: "体积包络 / 身宽比例",
    code: "Body_Volume_Envelope",
    detail: "正面白色腹部宽度约占身体总宽 45%-55%，身体厚度保持可穿戴充气服比例；侧面胸腹不能塌陷，背面不能膨胀成无结构圆柱。",
    confidence: 0.93,
    critical: true,
    confirmed: true,
  },
];

const defaultApiSettings: ApiSettings = {
  imageBaseUrl: "https://testvideo.site/v1",
  imagePath: "",
  imageApiKey: "",
  imageModel: "gpt-image-2",
  videoBaseUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis",
  videoPath: "",
  videoApiKey: "",
  videoModel: "happyhorse-1.0-i2v",
};

const productAssetPlan: ProductAsset[] = [
  {
    id: "PRODUCT_SHARK_001",
    name: "鲨鱼充气服",
    type: "充气服",
    viewMode: "四视图",
    viewUrls: [],
    lockedNodeCodes: initialNodes.map((node) => node.code),
    updatedAt: "规划中",
  },
];

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function loadApiSettings(): ApiSettings {
  if (typeof window === "undefined") return defaultApiSettings;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultApiSettings;
    const merged = { ...defaultApiSettings, ...(JSON.parse(saved) as Partial<ApiSettings>) };
    if (merged.imagePath === "/images/generations") merged.imagePath = "";
    if (merged.videoPath === "/videos/generations") merged.videoPath = "";
    if (merged.videoBaseUrl.replace(/\/+$/, "") === "https://dashscope.aliyuncs.com/api/v1") {
      merged.videoBaseUrl = defaultApiSettings.videoBaseUrl;
    }
    if (merged.videoModel === "happyhorse-1.0-t2v") {
      merged.videoModel = "happyhorse-1.0-i2v";
    }
    return merged;
  } catch {
    return defaultApiSettings;
  }
}

function extractTaskId(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const nested = record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : {};
  const output = record.output && typeof record.output === "object" ? (record.output as Record<string, unknown>) : {};
  const result = record.result && typeof record.result === "object" ? (record.result as Record<string, unknown>) : {};
  const value =
    record.task_id ||
    record.taskId ||
    record.id ||
    record.id_str ||
    nested.task_id ||
    nested.id ||
    nested.id_str ||
    output.task_id ||
    output.taskId ||
    output.id ||
    output.id_str ||
    result.task_id ||
    result.id ||
    result.id_str;
  return typeof value === "string" ? value : "";
}

function extractTaskStatus(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const output = record.output && typeof record.output === "object" ? (record.output as Record<string, unknown>) : {};
  const dataRecord = record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : {};
  const result = record.result && typeof record.result === "object" ? (record.result as Record<string, unknown>) : {};
  const value =
    record.task_status ||
    record.status ||
    record.taskStatus ||
    output.task_status ||
    output.status ||
    dataRecord.task_status ||
    dataRecord.status ||
    result.task_status ||
    result.status ||
    result.taskStatus;
  return typeof value === "string" ? value.toUpperCase() : "";
}

function findUrlByKey(value: unknown, keyPattern: RegExp): string {
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUrlByKey(item, keyPattern);
      if (found) return found;
    }
    return "";
  }
  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    if (/^(upstreamUrl|requestUrl|taskUrl|statusUrl)$/i.test(key)) continue;
    if (typeof child === "string" && keyPattern.test(key) && /^https?:\/\//i.test(child)) {
      return child;
    }
    const found = findUrlByKey(child, keyPattern);
    if (found) return found;
  }
  return "";
}

function extractVideoUrl(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const direct = findUrlByKey(data, /^(video_url|videoUrl|output_video|file_url|result_url|content_url)$/i);
  if (direct) return direct;
  const fallback = findUrlByKey(data, /^url$/i);
  if (/\.(mp4|mov|webm|m3u8)(\?|$)/i.test(fallback)) return fallback;
  return "";
}

function extractImageUrl(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const dataValue = record.data;
  if (Array.isArray(dataValue)) {
    const first = dataValue[0] as Record<string, unknown> | undefined;
    if (typeof first?.url === "string") return first.url;
    if (typeof first?.b64_json === "string") return `data:image/png;base64,${first.b64_json}`;
  }
  const dashScopeUrl = findUrlByKey(record.output, /^(image|url|image_url|imageUrl|result_url)$/i);
  if (dashScopeUrl) return dashScopeUrl;
  const imageUrl = findUrlByKey(record, /^(image|image_url|imageUrl|result_url)$/i);
  if (imageUrl) return imageUrl;
  if (typeof record.url === "string") return record.url;
  if (typeof record.image_url === "string") return record.image_url;
  return "";
}

function extractErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return "接口请求失败";
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;
    if (typeof errorRecord.message === "string") return errorRecord.message;
    if (typeof errorRecord.code === "string") return errorRecord.code;
  }
  if (typeof record.message === "string") return record.message;
  if (typeof record.code === "string") return record.code;
  if (typeof record.raw === "string" && record.raw.includes("Error code 524")) {
    return "上游接口处理超时，请稍后重试或改用异步任务接口。";
  }
  return "接口请求失败，请检查接口地址、路径、模型和图片参数。";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Read file failed"));
    reader.readAsDataURL(file);
  });
}

function getSlotImageUrl(slot?: UploadSlot) {
  if (!slot) return "";
  return slot.dataUrl || "";
}

export function App() {
  const [activeStep, setActiveStep] = useState<StepId>("upload");
  const [slots, setSlots] = useState(initialSlots);
  const [detailSlots, setDetailSlots] = useState(initialDetailSlots);
  const [lockNodes, setLockNodes] = useState(initialNodes);
  const [costumeType, setCostumeType] = useState("鲨鱼充气服");
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => loadApiSettings());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    { id: "H-2401", type: "首帧", title: "海边便利店首帧", time: "今天 10:24", status: "成功" },
    { id: "H-2398", type: "视频", title: "鲨鱼服递冰饮", time: "昨天 18:42", status: "处理中" },
    { id: "H-2391", type: "视频", title: "办公室展示", time: "昨天 14:07", status: "失败" },
  ]);
  const [productAssets] = useState<ProductAsset[]>(productAssetPlan);
  const [duration, setDuration] = useState(8);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [motionMode, setMotionMode] = useState<MotionMode>("strict");
  const [scenePrompt, setScenePrompt] = useState(
    "明亮超市海鲜区，穿着产品的人站在冰鲜鱼柜前，像认真挑选晚餐一样低头看鱼。画面有轻微喜剧感，真实电商短视频质感。",
  );
  const [videoActionPrompt, setVideoActionPrompt] = useState(
    "人物从已确认首帧姿势开始，轻微左右摇摆，抬起一只手鳍像是在跟鱼打招呼，最后回到正面。动作幅度小，稳定镜头。",
  );
  const [approvedFirstFrameUrl, setApprovedFirstFrameUrl] = useState("");
  const [firstFrameApproved, setFirstFrameApproved] = useState(false);
  const [firstFrameError, setFirstFrameError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [videoTaskId, setVideoTaskId] = useState("");
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testing, setTesting] = useState<"image" | "video" | "">("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apiSettings));
  }, [apiSettings]);

  const allLocksConfirmed = lockNodes.every((node) => node.confirmed);
  const autoLockedNodes = useMemo(() => lockNodes.map((node) => ({ ...node, confirmed: true })), [lockNodes]);
  const requiredUrls = slots.map(getSlotImageUrl).filter(Boolean);
  const detailUrls = detailSlots.map(getSlotImageUrl).filter(Boolean);
  const uploadReady = requiredUrls.length === slots.length;
  const firstFrameReady = uploadReady && allLocksConfirmed;
  const videoReady = firstFrameReady && Boolean(approvedFirstFrameUrl.trim()) && firstFrameApproved;

  const completedSteps: Record<StepId, boolean> = {
    upload: uploadReady,
    firstFrame: Boolean(approvedFirstFrameUrl.trim()) && firstFrameApproved,
    video: videoStatus === "succeeded" || Boolean(videoUrl),
    qa: activeStep === "qa" && Boolean(videoUrl),
  };

  const motionText =
    motionMode === "strict"
      ? "0-8 degrees rotation, tiny bounce, no new camera angle, no scene cut."
      : motionMode === "balanced"
        ? "Up to 15 degrees rotation, one small step, simple funny gesture."
        : "More playful motion, but still preserve every locked product node.";

  const firstFramePayload = {
    base_url: apiSettings.imageBaseUrl,
    api_key: apiSettings.imageApiKey,
    model: apiSettings.imageModel,
    scene_prompt: scenePrompt,
    product_type: costumeType,
    image_urls: requiredUrls,
    detail_image_urls: detailUrls,
    locked_nodes: lockNodes.map(({ code, label, detail, confidence, confirmed }) => ({
      code,
      label,
      detail,
      confidence,
      confirmed,
    })),
    aspect_ratio: aspectRatio,
  };

  const videoPayload = {
    base_url: apiSettings.videoBaseUrl,
    api_key: apiSettings.videoApiKey,
    model: apiSettings.videoModel,
    action_prompt: videoActionPrompt,
    scene_prompt: scenePrompt,
    product_type: costumeType,
    locked_nodes: lockNodes.map(({ code, label, detail, confidence, confirmed }) => ({
      code,
      label,
      detail,
      confidence,
      confirmed,
    })),
    motion_rule: motionText,
    image_url: approvedFirstFrameUrl || "PASTE_APPROVED_FIRST_FRAME_URL",
    duration,
    aspect_ratio: aspectRatio,
    resolution: "1080p",
    audio: true,
    prompt_extend: false,
  };

  const videoStatusText =
    videoStatus === "submitted"
      ? "任务已提交"
      : videoStatus === "polling"
        ? "视频生成中"
        : videoStatus === "succeeded"
          ? "视频已生成"
          : videoStatus === "failed"
            ? "生成失败"
            : "";

  function invalidateGeneratedOutputs() {
    setApprovedFirstFrameUrl("");
    setFirstFrameApproved(false);
    setFirstFrameError("");
    setVideoError("");
    setVideoTaskId("");
    setVideoStatus("idle");
    setVideoUrl("");
  }

  async function updateSlotFile(id: string, file?: File) {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    invalidateGeneratedOutputs();
    setActiveStep("upload");
    const updateSlot = (slot: UploadSlot) =>
      slot.id === id ? { ...slot, file, fileName: file.name, localUrl, dataUrl: "" } : slot;
    setSlots((current) => current.map(updateSlot));
    setDetailSlots((current) => current.map(updateSlot));
    const dataUrl = await readFileAsDataUrl(file);
    const updateDataUrl = (slot: UploadSlot) => (slot.id === id ? { ...slot, dataUrl } : slot);
    setSlots((current) => current.map(updateDataUrl));
    setDetailSlots((current) => current.map(updateDataUrl));
  }

  function updateApiSettings(patch: Partial<ApiSettings>) {
    setApiSettings((current) => ({ ...current, ...patch, imagePath: "", videoPath: "" }));
  }

  function updateProductType(value: string) {
    invalidateGeneratedOutputs();
    setCostumeType(value);
    setActiveStep("upload");
  }

  function updateScenePrompt(value: string) {
    invalidateGeneratedOutputs();
    setScenePrompt(value);
  }

  function updateAspectRatio(value: string) {
    if (value === aspectRatio) return;
    invalidateGeneratedOutputs();
    setAspectRatio(value);
    if (activeStep !== "upload") setActiveStep("firstFrame");
  }

  function completeUploadStep() {
    if (!uploadReady) {
      setFirstFrameError("请先上传正面、左侧、右侧、背面四张核心产品图。细节图可选补充，不影响进入首帧。");
      return;
    }
    setLockNodes(autoLockedNodes);
    setActiveStep("firstFrame");
  }

  function selectStep(step: StepId) {
    if (step === "upload") {
      setActiveStep("upload");
      return;
    }
    if (step === "firstFrame" && uploadReady) {
      setActiveStep("firstFrame");
      return;
    }
    if (step === "video" && videoReady) {
      setActiveStep("video");
      return;
    }
    if (step === "qa" && Boolean(videoUrl)) {
      setActiveStep("qa");
      return;
    }
    if (!uploadReady) {
      setActiveStep("upload");
      setFirstFrameError("请先上传正面、左侧、右侧、背面四张核心产品图。");
    }
  }

  async function callBackend(kind: "firstFrame" | "video") {
    setIsSubmitting(true);
    setFirstFrameError("");
    setVideoError("");
    if (kind === "video") {
      setVideoTaskId("");
      setVideoUrl("");
      setVideoStatus("submitted");
    }
    try {
      const response = await fetch(kind === "firstFrame" ? "/api/first-frame" : "/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "firstFrame" ? firstFramePayload : videoPayload),
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(data));
      }

      const imageUrl = kind === "firstFrame" ? extractImageUrl(data) : "";
      if (kind === "firstFrame") {
        if (!imageUrl) {
          throw new Error("接口已返回，但没有找到图片地址。请检查模型是否返回 image/url 字段。");
        }
        setApprovedFirstFrameUrl(imageUrl);
        setFirstFrameApproved(false);
        setFirstFrameError("首帧已生成，请人工核对产品尺寸、比例和外形；首帧不过审，不进入视频。");
      }
      const newTaskId = extractTaskId(data);
      if (kind === "video") {
        const immediateVideoUrl = extractVideoUrl(data);
        if (immediateVideoUrl) {
          setVideoUrl(immediateVideoUrl);
          setVideoStatus("succeeded");
          setActiveStep("qa");
        } else if (newTaskId) {
          setVideoTaskId(newTaskId);
          setVideoStatus("polling");
          setVideoError(`任务已提交：${newTaskId}`);
        } else {
          setVideoStatus("failed");
          throw new Error("接口已返回，但没有找到视频地址或任务号。");
        }
      }
      const now = new Date();
      setHistoryItems((current) => [
        {
          id: newTaskId || `LOCAL-${now.getTime()}`,
          type: kind === "firstFrame" ? "首帧" : "视频",
          title: kind === "firstFrame" ? "首帧生成" : "视频生成",
          time: now.toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          status: "处理中",
        },
        ...current,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "接口请求失败";
      if (kind === "firstFrame") setFirstFrameError(message);
      if (kind === "video") {
        setVideoStatus("failed");
        setVideoError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!videoTaskId || videoStatus !== "polling") return;
    let stopped = false;
    let timer: number | undefined;
    let attempts = 0;

    async function pollVideoStatus() {
      attempts += 1;
      try {
        const response = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: videoTaskId,
            base_url: apiSettings.videoBaseUrl,
            api_key: apiSettings.videoApiKey,
          }),
        });
        const data: unknown = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(data));
        }

        const status = extractTaskStatus(data);
        const nextVideoUrl = extractVideoUrl(data);
        if (nextVideoUrl || status === "SUCCEEDED" || status === "SUCCESS") {
          if (!nextVideoUrl) {
            throw new Error("任务已完成，但没有返回视频地址。");
          }
          setVideoUrl(nextVideoUrl);
          setVideoStatus("succeeded");
          setVideoError("视频生成成功");
          setHistoryItems((current) =>
            current.map((item) => (item.id === videoTaskId ? { ...item, status: "成功" } : item)),
          );
          setActiveStep("qa");
          return;
        }

        if (status === "FAILED" || status === "ERROR" || status === "CANCELED" || status === "UNKNOWN") {
          throw new Error(extractErrorMessage(data));
        }

        setVideoError(`生成中：${status || "等待上游返回状态"}（${attempts}）`);
        if (!stopped) timer = window.setTimeout(pollVideoStatus, 3500);
      } catch (error) {
        const message = error instanceof Error ? error.message : "视频状态查询失败";
        setVideoStatus("failed");
        setVideoError(message);
        setHistoryItems((current) =>
          current.map((item) => (item.id === videoTaskId ? { ...item, status: "失败" } : item)),
        );
      }
    }

    pollVideoStatus();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [apiSettings.videoApiKey, apiSettings.videoBaseUrl, videoStatus, videoTaskId]);

  async function testApi(kind: "image" | "video") {
    setTesting(kind);
    setFirstFrameError("");
    setVideoError("");
    try {
      const response = await fetch(kind === "image" ? "/api/test-image" : "/api/test-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "image" ? firstFramePayload : videoPayload),
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(data));
      }
      const message = kind === "image" ? "图片接口和模型可用。" : "视频接口和模型可用。";
      if (kind === "image") setFirstFrameError(message);
      if (kind === "video") setVideoError(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "接口测试失败";
      if (kind === "image") setFirstFrameError(message);
      if (kind === "video") setVideoError(message);
    } finally {
      setTesting("");
    }
  }

  return (
    <div className="workbench">
      <header className="topbar">
        <div className="brand-block">
          <strong>电商产品视频AI专家工具</strong>
          <nav>
            <span>项目</span>
            <span>素材</span>
            <span>工作流</span>
          </nav>
        </div>
        <div className="topbar-actions">
          <button className="soft-action">保存</button>
          <button className="soft-action" onClick={() => setHistoryOpen(true)}>
            <Database size={16} />
            轻后台
          </button>
          <button className="primary-mini">导出视频</button>
          <div className="avatar" aria-label="用户">视</div>
        </div>
      </header>

      <div className="workbench-body">
        <aside className="left-rail">
          <div className="project-tile">
            <div className="project-thumb">
              <FileImage size={20} />
            </div>
            <div>
              <strong>样片项目</strong>
              <span>{costumeType}</span>
            </div>
          </div>
          <button className="new-workflow">新建流程</button>
        </aside>

        <main className="center-stage">
          {activeStep === "upload" && (
            <UploadStep
              slots={slots}
              detailSlots={detailSlots}
              costumeType={costumeType}
              setCostumeType={updateProductType}
              onFile={updateSlotFile}
              canComplete={uploadReady}
              onComplete={() => completeUploadStep()}
            />
          )}
          {activeStep === "firstFrame" && (
            <FirstFrameStep
              prompt={scenePrompt}
              setPrompt={updateScenePrompt}
              apiSettings={apiSettings}
              updateApiSettings={updateApiSettings}
              aspectRatio={aspectRatio}
              setAspectRatio={updateAspectRatio}
              productViews={slots}
              detailViews={detailSlots}
              approvedUrl={approvedFirstFrameUrl}
              isApproved={firstFrameApproved}
              onApprove={() => setFirstFrameApproved(true)}
              error={firstFrameError}
              canGenerate={firstFrameReady}
              isSubmitting={isSubmitting}
              isTesting={testing === "image"}
              onGenerate={() => callBackend("firstFrame")}
              onTest={() => testApi("image")}
              onNext={() => setActiveStep("video")}
            />
          )}
          {activeStep === "video" && (
            <VideoStep
              prompt={videoActionPrompt}
              setPrompt={setVideoActionPrompt}
              apiSettings={apiSettings}
              updateApiSettings={updateApiSettings}
              duration={duration}
              setDuration={setDuration}
              motionMode={motionMode}
              setMotionMode={setMotionMode}
              canGenerate={videoReady}
              isSubmitting={isSubmitting}
              isTesting={testing === "video"}
              error={videoError}
              aspectRatio={aspectRatio}
              status={videoStatus}
              statusText={videoStatusText}
              taskId={videoTaskId}
              videoUrl={videoUrl}
              onGenerate={() => callBackend("video")}
              onTest={() => testApi("video")}
            />
          )}
          {activeStep === "qa" && <QaStep videoUrl={videoUrl} aspectRatio={aspectRatio} />}
        </main>
      </div>
      <WorkflowTimeline
        activeStep={activeStep}
        completed={completedSteps}
        canEnterFirstFrame={uploadReady}
        canEnterVideo={videoReady}
        canEnterQa={Boolean(videoUrl)}
        onSelect={selectStep}
      />
      {historyOpen && (
        <HistoryDrawer
          items={historyItems}
          products={productAssets}
          onClose={() => setHistoryOpen(false)}
          onClear={() => setHistoryItems([])}
          onRemove={(id) => setHistoryItems((current) => current.filter((item) => item.id !== id))}
        />
      )}
    </div>
  );
}

function UploadStep(props: {
  slots: UploadSlot[];
  detailSlots: UploadSlot[];
  costumeType: string;
  setCostumeType: (value: string) => void;
  onFile: (id: string, file?: File) => void;
  canComplete: boolean;
  onComplete: () => void;
}) {
  function handleDrop(id: string, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    props.onFile(id, event.dataTransfer.files?.[0]);
  }

  return (
    <section className="stage-panel">
      <StageHeader eyebrow="第 1 步" title="上传产品四视图" />
      <div className="lock-note">核心四视图上传后才进入首帧。正面、左侧、右侧、背面用于锁定尺寸、比例、外形和拓扑；细节图是可选补充，用来强化阀门、脸窗、拉链、缝线、褶皱等易漂移部位。</div>
      <div className="field-grid">
        <label>
          产品类型
          <select value={props.costumeType} onChange={(event) => props.setCostumeType(event.target.value)}>
            <option>鲨鱼充气服</option>
            <option>青蛙充气服</option>
            <option>霸王龙充气服</option>
            <option>相扑充气服</option>
            <option>狮子充气服</option>
            <option>通用充气服</option>
          </select>
        </label>
      </div>
      <div className="upload-section-title">
        <strong>核心四视图</strong>
        <span>必填，用于后台提取产品结构</span>
      </div>
      <div className="asset-grid">
        {props.slots.map((slot) => (
          <article className="asset-card" key={slot.id}>
            <label className="asset-preview">
              <input type="file" accept={slot.accept} onChange={(event) => props.onFile(slot.id, event.target.files?.[0])} />
              <div
                className="drop-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(slot.id, event)}
              >
                {slot.localUrl ? (
                  <img src={slot.localUrl} alt={slot.label} />
                ) : (
                  <div className="missing-asset">
                    <CloudUpload size={30} />
                    <span>{slot.label}</span>
                    <small>上传图片</small>
                  </div>
                )}
                <em>{slot.badge}</em>
              </div>
            </label>
            <strong>{slot.label}</strong>
            <small>{slot.fileName || slot.hint}</small>
          </article>
        ))}
      </div>
      <div className="upload-section-title optional">
        <strong>细节补充</strong>
        <span>可选，不阻塞首帧生成</span>
      </div>
      <div className="detail-asset-grid">
        {props.detailSlots.map((slot) => (
          <article className="asset-card detail-card" key={slot.id}>
            <label className="asset-preview">
              <input type="file" accept={slot.accept} onChange={(event) => props.onFile(slot.id, event.target.files?.[0])} />
              <div
                className="drop-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(slot.id, event)}
              >
                {slot.localUrl ? (
                  <img src={slot.localUrl} alt={slot.label} />
                ) : (
                  <div className="missing-asset">
                    <CloudUpload size={26} />
                    <span>{slot.label}</span>
                    <small>上传图片</small>
                  </div>
                )}
                <em>{slot.badge}</em>
              </div>
            </label>
            <strong>{slot.label}</strong>
            <small>{slot.fileName || slot.hint}</small>
          </article>
        ))}
      </div>
      <div className="upload-actions">
        <button className="primary-action" type="button" disabled={!props.canComplete} onClick={props.onComplete}>
          <Check size={16} />
          素材上传完成
        </button>
      </div>
    </section>
  );
}

function FirstFrameStep(props: {
  prompt: string;
  setPrompt: (value: string) => void;
  apiSettings: ApiSettings;
  updateApiSettings: (patch: Partial<ApiSettings>) => void;
  aspectRatio: string;
  setAspectRatio: (value: string) => void;
  productViews: UploadSlot[];
  detailViews: UploadSlot[];
  approvedUrl: string;
  isApproved: boolean;
  onApprove: () => void;
  error: string;
  canGenerate: boolean;
  isSubmitting: boolean;
  isTesting: boolean;
  onGenerate: () => void;
  onTest: () => void;
  onNext: () => void;
}) {
  return (
    <section className="stage-panel">
      <StageHeader eyebrow="第 2 步" title="四视图合成首帧" />
      <div className="lock-note">一致性规则：正面、左侧、右侧、背面四张核心视图优先于场景创意；细节图只补强局部材质和易漂移部位。尺寸、比例、轮廓、阀门方向、尾鳍、鳃线、脸窗必须归位，看不见的结构隐藏，不挪位。</div>
      <div className="two-col">
        <div className="stack">
          <label className="scenario-card">
            低优先级场景描述
            <textarea
              value={props.prompt}
              onChange={(event) => props.setPrompt(event.target.value)}
              placeholder="只写场景和气氛，例如：超市海鲜区、办公室摸鱼、地铁通勤..."
            />
          </label>
          <div className="first-frame-review">
            {props.productViews.map((slot) => (
              <div className="review-pane" key={slot.id}>
                <div className="review-pane-head">
                  <strong>{slot.label}</strong>
                  <span>{slot.badge}</span>
                </div>
                {slot.localUrl ? (
                  <img className="review-image" src={slot.localUrl} alt={slot.label} />
                ) : (
                  <div className="frame-placeholder compact">
                    <FileImage size={34} />
                    <strong>等待{slot.label}</strong>
                  </div>
                )}
              </div>
            ))}
            {props.detailViews.some((slot) => Boolean(slot.localUrl)) &&
              props.detailViews.map((slot) => (
                <div className="review-pane detail-review-pane" key={slot.id}>
                  <div className="review-pane-head">
                    <strong>{slot.label}</strong>
                    <span>补充</span>
                  </div>
                  <img className="review-image" src={slot.localUrl} alt={slot.label} />
                </div>
              ))}
            <div className="review-pane">
              <div className="review-pane-head">
                <strong>生成首帧</strong>
                <span>{props.isApproved ? "已人工确认" : "待人工确认"}</span>
              </div>
              {props.approvedUrl ? (
                <img className="review-image" src={props.approvedUrl} alt="首帧预览" />
              ) : (
                <div className="frame-placeholder compact">
                  <Wand2 size={34} />
                  <strong>首帧预览</strong>
                </div>
              )}
            </div>
          </div>
          <div className={cn("generated-frame", `media-ratio-${props.aspectRatio.replace(":", "-")}`)}>
            <div className="render-badges">
              <span className={props.approvedUrl ? "render-ok" : ""}>{props.approvedUrl ? "已载入" : "待生成"}</span>
              <span>{props.isApproved ? "已过审" : "首帧不过审，不进入视频"}</span>
            </div>
            {props.approvedUrl ? (
              <img className="preview-image" src={props.approvedUrl} alt="首帧预览" />
            ) : (
              <div className="frame-placeholder">
                <Wand2 size={44} />
                <strong>首帧预览</strong>
              </div>
            )}
          </div>
        </div>
        <div className="parameter-panel">
          <h3>生成参数</h3>
          <label>
            首帧模型
            <input
              value={props.apiSettings.imageModel}
              onChange={(event) => props.updateApiSettings({ imageModel: event.target.value })}
              placeholder="gpt-image-2"
            />
          </label>
          <button className="secondary-action full-width" type="button" onClick={props.onTest} disabled={props.isTesting}>
            {props.isTesting ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            测试接口
          </button>
          <label>
            图片接口
            <input
              value={props.apiSettings.imageBaseUrl}
              onChange={(event) => props.updateApiSettings({ imageBaseUrl: event.target.value })}
              placeholder="https://testvideo.site/v1"
              autoComplete="off"
              name="image-api-url"
            />
          </label>
          <label>
            图片 API Key
            <div className="key-input">
              <KeyRound size={16} />
              <input
                value={props.apiSettings.imageApiKey}
                type="password"
                onChange={(event) => props.updateApiSettings({ imageApiKey: event.target.value })}
                placeholder="sk-..."
                autoComplete="new-password"
                name="image-api-token"
              />
            </div>
          </label>
          <label>
            清晰度
            <div className="pill-grid">
              <button type="button" className="active">1080p</button>
              <button type="button">4K UHD</button>
            </div>
          </label>
          <label>
            画面比例
            <div className="ratio-grid">
              {["16:9", "1:1", "9:16"].map((ratio) => (
                <button
                  type="button"
                  className={props.aspectRatio === ratio ? "active" : ""}
                  onClick={() => props.setAspectRatio(ratio)}
                  key={ratio}
                >
                  <i data-ratio={ratio} />
                  {ratio}
                </button>
              ))}
            </div>
          </label>
          <button className="primary-action" disabled={!props.canGenerate || props.isSubmitting} onClick={props.onGenerate}>
            {props.isSubmitting ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}
            根据核心四视图生成首帧
          </button>
          {props.approvedUrl && (
            <button
              className={cn("secondary-action full-width", props.isApproved && "approved-action")}
              type="button"
              onClick={props.onApprove}
            >
              <ShieldCheck size={16} />
              {props.isApproved ? "首帧已人工确认" : "确认产品一致，批准首帧"}
            </button>
          )}
          {props.approvedUrl && (
            <button className="secondary-action full-width" type="button" onClick={props.onNext} disabled={!props.isApproved}>
              <Film size={16} />
              进入视频生成
            </button>
          )}
          {props.error && <div className={cn("field-error", props.error.includes("成功") && "success")}>{props.error}</div>}
        </div>
      </div>
    </section>
  );
}

function VideoStep(props: {
  prompt: string;
  setPrompt: (value: string) => void;
  apiSettings: ApiSettings;
  updateApiSettings: (patch: Partial<ApiSettings>) => void;
  duration: number;
  setDuration: (value: number) => void;
  motionMode: MotionMode;
  setMotionMode: (value: MotionMode) => void;
  canGenerate: boolean;
  isSubmitting: boolean;
  isTesting: boolean;
  error: string;
  aspectRatio: string;
  status: VideoStatus;
  statusText: string;
  taskId: string;
  videoUrl: string;
  onGenerate: () => void;
  onTest: () => void;
}) {
  const isWorking = props.isSubmitting || props.status === "submitted" || props.status === "polling";
  return (
    <section className="stage-panel">
      <StageHeader eyebrow="第 3 步" title="生成视频" />
      <div className="two-col">
        <div className="stack">
          <div className={cn("video-preview", `media-ratio-${props.aspectRatio.replace(":", "-")}`)}>
            {props.videoUrl ? (
              <video controls playsInline src={props.videoUrl} />
            ) : (
              <div className="video-status-card">
                {isWorking ? <LoaderCircle className="spin" size={38} /> : <Play size={42} />}
                <strong>{props.statusText || "视频预览"}</strong>
                {props.taskId && <span>任务号：{props.taskId}</span>}
              </div>
            )}
          </div>
          <label className="scenario-card">
            视频动作描述
            <textarea
              value={props.prompt}
              onChange={(event) => props.setPrompt(event.target.value)}
              placeholder="写你希望视频里发生什么动作，例如：慢慢转身、挥手展示、递出产品、走近镜头..."
            />
          </label>
        </div>
        <div className="parameter-panel">
          <h3>视频参数</h3>
          <label>
            视频模型
            <input
              value={props.apiSettings.videoModel}
              onChange={(event) => props.updateApiSettings({ videoModel: event.target.value })}
            />
          </label>
          <button className="secondary-action full-width" type="button" onClick={props.onTest} disabled={props.isTesting}>
            {props.isTesting ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            测试接口
          </button>
          <label>
            视频接口
            <input
              value={props.apiSettings.videoBaseUrl}
              onChange={(event) => props.updateApiSettings({ videoBaseUrl: event.target.value })}
              placeholder="可直接粘贴 POST https://dashscope.aliyuncs.com/..."
              autoComplete="off"
              name="video-api-url"
            />
          </label>
          <label>
            视频 API Key
            <div className="key-input">
              <KeyRound size={16} />
              <input
                value={props.apiSettings.videoApiKey}
                type="password"
                onChange={(event) => props.updateApiSettings({ videoApiKey: event.target.value })}
                placeholder="sk-..."
                autoComplete="new-password"
                name="video-api-token"
              />
            </div>
          </label>
          <label>
            时长
            <input type="number" min={5} max={15} value={props.duration} onChange={(event) => props.setDuration(Number(event.target.value))} />
          </label>
          <div className="segmented">
            {[
              ["strict", "高一致性"],
              ["balanced", "平衡"],
              ["creative", "创意"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={props.motionMode === value ? "active" : ""}
                onClick={() => props.setMotionMode(value as MotionMode)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="primary-action" disabled={!props.canGenerate || isWorking} onClick={props.onGenerate}>
            {isWorking ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            {isWorking ? "生成中" : "生成视频"}
          </button>
          {props.error && <div className={cn("field-error", props.error.includes("成功") && "success")}>{props.error}</div>}
        </div>
      </div>
    </section>
  );
}

function QaStep(props: { videoUrl?: string; aspectRatio: string }) {
  const frames = [
    ["0%", 99],
    ["25%", 95],
    ["50%", 92],
    ["75%", 82],
    ["100%", 90],
  ] as const;
  return (
    <section className="stage-panel">
      <StageHeader eyebrow="第 4 步" title="视频质检" />
      <div className={cn("qa-video", `media-ratio-${props.aspectRatio.replace(":", "-")}`)}>
        {props.videoUrl ? (
          <video controls playsInline src={props.videoUrl} />
        ) : (
          <>
            <button className="play-button">
              <Play size={38} />
            </button>
            <span>视频预览</span>
          </>
        )}
      </div>
      <div className="timeline">
        <div className="timeline-head">
          <span>关键帧</span>
          <strong>00:04 / 00:08</strong>
        </div>
        <div className="timeline-track">
          <i />
          {frames.map(([time, score]) => (
            <button className={cn(score >= 90 && "passed", score < 90 && "warning")} key={time}>
              <span />
              <em>{time}</em>
            </button>
          ))}
        </div>
      </div>
      <div className="frame-grid">
        {frames.map(([time, score]) => (
          <div className={cn("frame-card", score < 90 && "bad")} key={time}>
            <div>{time}</div>
            <span>{score}% 一致</span>
          </div>
        ))}
      </div>
      <div className="score-grid">
        <Score label="货对版" value={85} danger />
        <Score label="动作趣味" value={75} />
        <Score label="场景丰富" value={90} />
      </div>
    </section>
  );
}

function StageHeader(props: { eyebrow: string; title: string }) {
  return (
    <div className="stage-header">
      <span>{props.eyebrow}</span>
      <h1>{props.title}</h1>
    </div>
  );
}

function WorkflowTimeline(props: {
  activeStep: StepId;
  completed: Record<StepId, boolean>;
  canEnterFirstFrame: boolean;
  canEnterVideo: boolean;
  canEnterQa: boolean;
  onSelect: (step: StepId) => void;
}) {
  const activeIndex = visibleSteps.findIndex((step) => step.id === props.activeStep);
  const canEnter: Record<StepId, boolean> = {
    upload: true,
    firstFrame: props.canEnterFirstFrame,
    video: props.canEnterVideo,
    qa: props.canEnterQa,
  };
  return (
    <nav className="workflow-timeline" aria-label="生成流程">
      <div className="timeline-line" />
      {visibleSteps.map((step, index) => {
        const Icon = step.icon;
        const isActive = props.activeStep === step.id;
        const isDone = props.completed[step.id];
        const isPast = index < activeIndex;
        const isLocked = !canEnter[step.id];
        return (
          <button
            type="button"
            key={step.id}
            aria-disabled={isLocked}
            className={cn("timeline-step", isActive && "active", (isDone || isPast) && "done", isLocked && "locked")}
            onClick={() => props.onSelect(step.id)}
          >
            <span className="timeline-dot">
              {isDone || isPast ? <Check size={16} /> : <Icon size={16} />}
            </span>
            <span className="timeline-copy">
              <strong>{step.shortLabel}</strong>
              <em>{step.description}</em>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function HistoryDrawer(props: {
  items: HistoryItem[];
  products: ProductAsset[];
  onClose: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="history-backdrop" role="dialog" aria-modal="true" aria-label="轻后台">
      <button className="history-scrim" aria-label="关闭轻后台" onClick={props.onClose} />
      <aside className="history-drawer">
        <div className="history-head">
          <div>
            <span>轻后台</span>
            <h2>历史记录</h2>
          </div>
          <button className="icon-action" aria-label="关闭" onClick={props.onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="history-actions">
          <button className="secondary-action" onClick={props.onClear} disabled={props.items.length === 0}>
            <Trash2 size={16} />
            清空记录
          </button>
        </div>

        <div className="product-library-plan">
          <strong>产品库</strong>
          {props.products.map((product) => (
            <article key={product.id}>
              <span>{product.viewMode}</span>
              <div>
                <b>{product.name}</b>
                <small>{product.type} · 已锁 {product.lockedNodeCodes.length} 项细节</small>
              </div>
            </article>
          ))}
        </div>

        <div className="history-list">
          {props.items.length === 0 ? (
            <div className="history-empty">暂无记录</div>
          ) : (
            props.items.map((item) => (
              <article className="history-item" key={item.id}>
                <div>
                  <span className="history-type">{item.type}</span>
                  <strong>{item.title}</strong>
                  <small>{item.time}</small>
                </div>
                <div className="history-side">
                  <span
                    className={cn(
                      "history-status",
                      item.status === "成功" && "ok",
                      item.status === "失败" && "fail",
                    )}
                  >
                    {item.status}
                  </span>
                  <button className="icon-action subtle" aria-label="删除记录" onClick={() => props.onRemove(item.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function Score(props: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={cn("score-card", props.danger && "danger")}>
      <div>
        <span>{props.label}</span>
        <strong>{props.value}%</strong>
      </div>
      <div>
        <i style={{ width: `${props.value}%` }} />
      </div>
    </div>
  );
}

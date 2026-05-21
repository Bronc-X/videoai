import {
  AlertTriangle,
  Check,
  CircleDot,
  ClipboardCheck,
  CloudUpload,
  Database,
  FileImage,
  Film,
  Image,
  KeyRound,
  LoaderCircle,
  Lock,
  Play,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  ZoomIn,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DragEvent } from "react";
import { useMemo, useState } from "react";

type StepId = "upload" | "lock" | "firstFrame" | "video" | "qa";
type MotionMode = "strict" | "balanced" | "creative";
type ApiTone = "ok" | "warn";

type UploadSlot = {
  id: string;
  label: string;
  badge: string;
  fileName: string;
  localUrl: string;
  dataUrl?: string;
  remoteUrl: string;
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

type ApiResult = {
  tone: ApiTone;
  message?: string;
};

type ApiSettings = {
  imageBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
  videoBaseUrl: string;
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

const steps: Array<{ id: StepId; label: string; icon: LucideIcon }> = [
  { id: "upload", label: "上传", icon: Upload },
  { id: "lock", label: "定款", icon: Lock },
  { id: "firstFrame", label: "首帧", icon: Image },
  { id: "video", label: "视频", icon: Film },
  { id: "qa", label: "质检", icon: ClipboardCheck },
];

const initialSlots: UploadSlot[] = [
  { id: "front", label: "正面图", badge: "FRONT", fileName: "", localUrl: "", remoteUrl: "" },
  { id: "side", label: "侧面图", badge: "SIDE", fileName: "", localUrl: "", remoteUrl: "" },
  { id: "back", label: "背面图", badge: "REAR", fileName: "", localUrl: "", remoteUrl: "" },
];

const initialNodes: LockNode[] = [
  {
    id: "face-window",
    label: "露脸窗口 / 透明窗口",
    code: "Face_Window_Aperture",
    detail: "保持透明或开口属性，不能变成嘴、牙齿、logo 或装饰图案。",
    confidence: 0.98,
    critical: true,
    confirmed: false,
  },
  {
    id: "blower",
    label: "鼓风机 / 进气口",
    code: "Blower_Intake_Valve",
    detail: "保持原始侧腰或背侧位置，不能漂移、放大、消失。",
    confidence: 0.85,
    critical: true,
    confirmed: false,
  },
  {
    id: "appendage",
    label: "尾巴 / 鳍 / 耳朵 / 鬃毛 / 脊刺",
    code: "Appendage_Structure",
    detail: "附加结构不能复制、融化、断裂、乱长或改变连接位置。",
    confidence: 0.92,
    critical: true,
    confirmed: false,
  },
  {
    id: "feet",
    label: "脚套 / 可见鞋子",
    code: "Foot_Covers_Base",
    detail: "底部形态必须稳定，不能换鞋、吞脚或变成动物足部。",
    confidence: 0.45,
    critical: true,
    confirmed: false,
  },
  {
    id: "zipper",
    label: "拉链 / 穿戴入口线",
    code: "Zipper_Line_Seam",
    detail: "保持原始走向、长度、位置和布料接缝关系。",
    confidence: 0.6,
    critical: true,
    confirmed: false,
  },
];

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function extractTaskId(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const nested = record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : {};
  const value = record.task_id || record.taskId || record.id || nested.task_id || nested.id;
  return typeof value === "string" ? value : "";
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
  if (typeof record.raw === "string" && record.raw.includes("Error code 524")) {
    return "上游接口处理超时，请稍后重试或改用异步任务接口。";
  }
  return "接口请求失败，请检查接口地址、模型和图片参数。";
}

function isImageModel(model: string) {
  const normalized = model.trim().toLowerCase();
  return normalized.includes("image") || normalized.startsWith("dall-e");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Read file failed"));
    reader.readAsDataURL(file);
  });
}

export function App() {
  const [activeStep, setActiveStep] = useState<StepId>("upload");
  const [slots, setSlots] = useState(initialSlots);
  const [lockNodes, setLockNodes] = useState(initialNodes);
  const [costumeType, setCostumeType] = useState("鲨鱼充气服");
  const [firstFrameModel, setFirstFrameModel] = useState("gpt-image-2");
  const [videoModel, setVideoModel] = useState("sora-2-vvip");
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    imageBaseUrl: "https://toapis.com/v1",
    imageApiKey: "",
    imageModel: "gpt-image-2",
    videoBaseUrl: "https://toapis.com/v1",
    videoApiKey: "",
    videoModel: "sora-2-vvip",
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    { id: "H-2401", type: "首帧", title: "海边便利店首帧", time: "今天 10:24", status: "成功" },
    { id: "H-2398", type: "视频", title: "鲨鱼服递冰饮", time: "昨天 18:42", status: "处理中" },
    { id: "H-2391", type: "视频", title: "办公室展示", time: "昨天 14:07", status: "失败" },
  ]);
  const [duration, setDuration] = useState(8);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [motionMode, setMotionMode] = useState<MotionMode>("strict");
  const [scenePrompt, setScenePrompt] = useState(
    "海边便利店门口，穿充气服的人认真给游客递冰饮，动作轻微滑稽，真实商业短视频质感。",
  );
  const [approvedFirstFrameUrl, setApprovedFirstFrameUrl] = useState("");
  const [apiResult, setApiResult] = useState<ApiResult>({
    tone: "warn",
    message: "",
  });
  const [firstFrameError, setFirstFrameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmedCount = lockNodes.filter((node) => node.confirmed).length;
  const allLocksConfirmed = confirmedCount === lockNodes.length;
  const uploadedUrls = slots
    .map((slot) => slot.remoteUrl.trim() || slot.dataUrl || "")
    .filter(Boolean);
  const uploadReady = uploadedUrls.length > 0;
  const firstFrameReady = uploadReady && allLocksConfirmed;
  const videoReady = firstFrameReady && Boolean(approvedFirstFrameUrl.trim());

  const lockedSummary = lockNodes
    .map((node) => `${node.code}: ${node.confirmed ? "LOCKED" : "PENDING"} - ${node.detail}`)
    .join("\n");

  const firstFramePrompt = useMemo(
    () =>
      [
        "Use the uploaded product images as exact references.",
        `Product type: ${costumeType}. This must remain a wearable inflatable costume.`,
        "Do not turn it into a real animal, cartoon mascot, plush toy, CGI creature, or redesigned character.",
        "Preserve inflated fabric, seams, wrinkles, transparent/face opening, fan valve, zipper, leg opening, shoes, tail/fins/appendages.",
        `Locked nodes:\n${lockedSummary}`,
        `Scene: ${scenePrompt}`,
        "Composition: vertical 9:16, full body visible, three-quarter angle only if it does not hide the fan valve or face window.",
        "Negative: no mouth, no teeth, no new accessories, no logo, no moved valve, no missing face window, no deformed appendages.",
      ].join("\n\n"),
    [costumeType, lockedSummary, scenePrompt],
  );

  const motionText =
    motionMode === "strict"
      ? "0-8 degrees rotation, tiny bounce, no new camera angle, no scene cut."
      : motionMode === "balanced"
        ? "Up to 15 degrees rotation, one small step, simple funny gesture."
        : "More playful motion, but still preserve every locked product node.";

  const videoPrompt = useMemo(
    () =>
      [
        "Use the approved first frame as the locked starting image.",
        "Animate the same wearable inflatable product only. Do not redesign or reinterpret it.",
        `Strict locked nodes:\n${lockedSummary}`,
        `Scene continuation: ${scenePrompt}`,
        `Motion rule: ${motionText}`,
        "Camera: stable vertical 9:16 medium-wide shot, full body visible, no cuts, no fast zoom.",
        "Audio: if supported, use off-screen narrator only. The costume itself must not open a mouth.",
        "Negative: no mouth, no teeth, no moved fan valve, no missing face window, no broken tail, no duplicated appendages, no body deformation.",
      ].join("\n\n"),
    [lockedSummary, motionText, scenePrompt],
  );

  const firstFramePayload = {
    base_url: apiSettings.imageBaseUrl,
    api_key: apiSettings.imageApiKey,
    model: firstFrameModel,
    prompt: firstFramePrompt,
    image_urls: uploadedUrls,
    aspect_ratio: aspectRatio,
  };

  const videoPayload = {
    base_url: apiSettings.videoBaseUrl,
    api_key: apiSettings.videoApiKey,
    model: videoModel,
    prompt: videoPrompt,
    image_url: approvedFirstFrameUrl || "PASTE_APPROVED_FIRST_FRAME_URL",
    duration,
    aspect_ratio: aspectRatio,
    resolution: "1080p",
    audio: true,
    prompt_extend: false,
  };

  async function updateSlotFile(id: string, file?: File) {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setSlots((current) =>
      current.map((slot) =>
        slot.id === id ? { ...slot, file, fileName: file.name, localUrl, dataUrl: "" } : slot,
      ),
    );
    const dataUrl = await readFileAsDataUrl(file);
    setSlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, dataUrl } : slot)),
    );
  }

  function updateApiSettings(patch: Partial<ApiSettings>) {
    setApiSettings((current) => ({ ...current, ...patch }));
    if (patch.imageModel) setFirstFrameModel(patch.imageModel);
    if (patch.videoModel) setVideoModel(patch.videoModel);
  }

  function updateRemoteUrl(id: string, remoteUrl: string) {
    setSlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, remoteUrl } : slot)),
    );
  }

  function toggleNode(id: string) {
    setLockNodes((current) =>
      current.map((node) => (node.id === id ? { ...node, confirmed: !node.confirmed } : node)),
    );
  }

  async function callBackend(kind: "health" | "firstFrame" | "video" | "status", taskId?: string) {
    if (kind === "firstFrame" && !isImageModel(firstFrameModel)) {
      setFirstFrameError("首帧模型请填图片模型，如 gpt-image-2");
      setApiResult({ tone: "warn", message: "首帧模型不是图片模型" });
      return;
    }

    setIsSubmitting(true);
    setFirstFrameError("");
    try {
      let response: Response;
      if (kind === "health") {
        response = await fetch("/api/health");
      } else if (kind === "firstFrame") {
        response = await fetch("/api/first-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(firstFramePayload),
        });
      } else if (kind === "video") {
        response = await fetch("/api/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(videoPayload),
        });
      } else {
        response = await fetch(`/api/video/${encodeURIComponent(taskId || "")}`);
      }

      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(data));
      }
      const newTaskId = extractTaskId(data);
      if (kind === "firstFrame" || kind === "video") {
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
      }
      setApiResult({
        tone: "ok",
        message: "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "接口请求失败";
      if (kind === "firstFrame") {
        setFirstFrameError(message);
      }
      setApiResult({
        tone: "warn",
        message,
      });
    } finally {
      setIsSubmitting(false);
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
          <button onClick={() => callBackend("health")}>
            <CircleDot size={16} />
            测试接口
          </button>
          <button className="primary-mini">导出视频</button>
          <div className="avatar" aria-label="用户">气</div>
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
          <nav>
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  className={cn("nav-item", activeStep === step.id && "active")}
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                >
                  <Icon size={18} />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="center-stage">
          {activeStep === "upload" && (
            <UploadStep
              slots={slots}
              costumeType={costumeType}
              setCostumeType={setCostumeType}
              onFile={updateSlotFile}
              onRemoteUrl={updateRemoteUrl}
            />
          )}
          {activeStep === "lock" && (
            <LockStep
              slots={slots}
              nodes={lockNodes}
              onToggle={toggleNode}
            />
          )}
          {activeStep === "firstFrame" && (
            <FirstFrameStep
              prompt={scenePrompt}
              setPrompt={setScenePrompt}
              model={firstFrameModel}
              setModel={(value) => updateApiSettings({ imageModel: value })}
              apiSettings={apiSettings}
              updateApiSettings={updateApiSettings}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              approvedUrl={approvedFirstFrameUrl}
              setApprovedUrl={setApprovedFirstFrameUrl}
              error={firstFrameError}
              canGenerate={firstFrameReady}
              isSubmitting={isSubmitting}
              onGenerate={() => callBackend("firstFrame")}
            />
          )}
          {activeStep === "video" && (
            <VideoStep
              prompt={videoPrompt}
              model={videoModel}
              setModel={(value) => updateApiSettings({ videoModel: value })}
              apiSettings={apiSettings}
              updateApiSettings={updateApiSettings}
              duration={duration}
              setDuration={setDuration}
              motionMode={motionMode}
              setMotionMode={setMotionMode}
              canGenerate={videoReady}
              isSubmitting={isSubmitting}
              onGenerate={() => callBackend("video")}
            />
          )}
          {activeStep === "qa" && <QaStep />}
        </main>

        <aside className="right-inspector">
          <ReadinessPanel
            uploaded={uploadedUrls.length}
            confirmed={confirmedCount}
            total={lockNodes.length}
            firstFrameReady={firstFrameReady}
            videoReady={videoReady}
          />
          <ApiPanel
            result={apiResult}
          />
        </aside>
      </div>
      {historyOpen && (
        <HistoryDrawer
          items={historyItems}
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
  costumeType: string;
  setCostumeType: (value: string) => void;
  onFile: (id: string, file?: File) => void;
  onRemoteUrl: (id: string, remoteUrl: string) => void;
}) {
  function handleDrop(id: string, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    props.onFile(id, event.dataTransfer.files?.[0]);
  }

  return (
    <section className="stage-panel">
      <StageHeader
        eyebrow="第 1 步"
        title="上传产品图"
      />
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
      <div className="asset-grid">
        {props.slots.map((slot) => (
          <article className="asset-card" key={slot.id}>
            <label className="asset-preview">
              <input type="file" accept="image/*" onChange={(event) => props.onFile(slot.id, event.target.files?.[0])} />
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
                  <small>点击或拖入图片</small>
                </div>
              )}
              <em>{slot.badge}</em>
              </div>
            </label>
            <strong>{slot.label}</strong>
            <small>{slot.fileName || "待上传"}</small>
            <input
              value={slot.remoteUrl}
              placeholder="图片 URL"
              onChange={(event) => props.onRemoteUrl(slot.id, event.target.value)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

function LockStep(props: {
  slots: UploadSlot[];
  nodes: LockNode[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="stage-panel">
      <StageHeader
        eyebrow="第 2 步"
        title="确认产品细节"
      />
      <div className="reference-strip">
        {props.slots.map((slot) => (
          <div className="mini-reference" key={slot.id}>
            {slot.localUrl ? <img src={slot.localUrl} alt={slot.label} /> : <FileImage size={28} />}
            <span>{slot.badge}</span>
          </div>
        ))}
      </div>
      <div className="lock-table">
        {props.nodes.map((node) => (
          <div className={cn("lock-row", node.confirmed && "locked")} key={node.id}>
            <button onClick={() => props.onToggle(node.id)} className="lock-dot">
              {node.confirmed && <Check size={13} />}
            </button>
            <div>
              <strong>{node.code}</strong>
              <span>{node.label}</span>
            </div>
            <div className="confidence">
              <div>
                <i style={{ width: `${Math.round(node.confidence * 100)}%` }} />
              </div>
              <span>{node.confidence.toFixed(2)}</span>
            </div>
            <button onClick={() => props.onToggle(node.id)} className={cn("lock-action", node.confirmed && "active")}>
              {node.confirmed ? "已确认" : "确认"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function FirstFrameStep(props: {
  prompt: string;
  setPrompt: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  apiSettings: ApiSettings;
  updateApiSettings: (patch: Partial<ApiSettings>) => void;
  aspectRatio: string;
  setAspectRatio: (value: string) => void;
  approvedUrl: string;
  setApprovedUrl: (value: string) => void;
  error: string;
  canGenerate: boolean;
  isSubmitting: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className="stage-panel">
      <StageHeader
        eyebrow="第 3 步"
        title="生成首帧"
      />
      <div className="two-col">
        <div className="stack">
          <label className="scenario-card">
            场景描述
            <textarea value={props.prompt} onChange={(event) => props.setPrompt(event.target.value)} />
          </label>
          <div className="generated-frame">
            <div className="render-badges">
              <span className="render-ok">待生成</span>
              <span>1920x1080</span>
            </div>
            <button className="canvas-tool" aria-label="Zoom preview">
              <ZoomIn size={19} />
            </button>
            <div className="frame-placeholder">
              <Wand2 size={44} />
              <strong>首帧预览</strong>
            <span>粘贴首帧图片 URL</span>
            </div>
          </div>
          <label>
            首帧 URL
            <input value={props.approvedUrl} onChange={(event) => props.setApprovedUrl(event.target.value)} placeholder="https://..." />
          </label>
        </div>
        <div className="parameter-panel">
          <h3>生成参数</h3>
          <label>
            首帧模型
            <input value={props.model} onChange={(event) => props.setModel(event.target.value)} placeholder="gpt-image-2" />
          </label>
          <label>
            图片接口
            <input
              value={props.apiSettings.imageBaseUrl}
              onChange={(event) => props.updateApiSettings({ imageBaseUrl: event.target.value })}
              placeholder="https://toapis.com/v1"
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
            生成首帧
          </button>
          {props.error && <div className="field-error">{props.error}</div>}
        </div>
      </div>
    </section>
  );
}

function VideoStep(props: {
  prompt: string;
  model: string;
  setModel: (value: string) => void;
  apiSettings: ApiSettings;
  updateApiSettings: (patch: Partial<ApiSettings>) => void;
  duration: number;
  setDuration: (value: number) => void;
  motionMode: MotionMode;
  setMotionMode: (value: MotionMode) => void;
  canGenerate: boolean;
  isSubmitting: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className="stage-panel">
      <StageHeader
        eyebrow="第 4 步"
        title="生成视频"
      />
      <div className="two-col">
        <div className="stack">
          <div className="video-preview">
            <Play size={42} />
            <strong>视频预览</strong>
            <span>等待生成结果</span>
          </div>
          <textarea value={props.prompt} readOnly />
        </div>
        <div className="parameter-panel">
          <h3>视频参数</h3>
          <label>
            视频模型
            <input value={props.model} onChange={(event) => props.setModel(event.target.value)} />
          </label>
          <label>
            视频接口
            <input
              value={props.apiSettings.videoBaseUrl}
              onChange={(event) => props.updateApiSettings({ videoBaseUrl: event.target.value })}
              placeholder="https://toapis.com/v1"
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
          <button className="primary-action" disabled={!props.canGenerate || props.isSubmitting} onClick={props.onGenerate}>
            {props.isSubmitting ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            生成视频
          </button>
        </div>
      </div>
    </section>
  );
}

function QaStep() {
  const frames = [
    ["0%", 99],
    ["25%", 95],
    ["50%", 92],
    ["75%", 82],
    ["100%", 90],
  ] as const;
  return (
    <section className="stage-panel">
      <StageHeader
        eyebrow="第 5 步"
        title="视频质检"
      />
      <div className="qa-video">
        <button className="play-button">
          <Play size={38} />
        </button>
        <span>视频预览</span>
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

function ReadinessPanel(props: {
  uploaded: number;
  confirmed: number;
  total: number;
  firstFrameReady: boolean;
  videoReady: boolean;
}) {
  const progress = Math.round((props.confirmed / props.total) * 100);
  return (
    <section className="inspector-card">
      <h2>
        <ShieldCheck size={16} />
        生成条件
      </h2>
      <div className="gate-hero">
        <strong>{props.videoReady ? "可生成视频" : props.firstFrameReady ? "可生成首帧" : "待确认"}</strong>
      </div>
      <InfoRow label="产品图" value={`${props.uploaded}/3`} />
      <InfoRow label="细节进度" value={`${progress}%`} />
      <div className="segment-bar">
        {Array.from({ length: props.total }).map((_, index) => (
          <span className={index < props.confirmed ? "filled" : ""} key={index} />
        ))}
      </div>
      <Notice ok={props.firstFrameReady}>首帧准备</Notice>
      <Notice ok={props.videoReady}>视频准备</Notice>
    </section>
  );
}

function ApiPanel(props: { result: ApiResult }) {
  return (
    <section className="inspector-card">
      <h2>
        <Settings2 size={16} />
        接口状态
      </h2>
      <div className={cn("api-light", props.result.tone === "ok" && "ok", props.result.tone === "warn" && "warn")}>
        <span />
        <strong>{props.result.tone === "ok" ? "成功" : "失败"}</strong>
      </div>
      {props.result.message && <p className="api-message">{props.result.message}</p>}
    </section>
  );
}

function HistoryDrawer(props: {
  items: HistoryItem[];
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

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function Notice(props: { ok: boolean; children: string }) {
  return (
    <div className={cn("gate-notice", props.ok && "ok")}>
      {props.ok ? <Check size={15} /> : <AlertTriangle size={15} />}
      {props.children}
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

import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const TOAPIS_BASE_URL = (process.env.TOAPIS_BASE_URL || "https://toapis.com/v1").replace(/\/+$/, "");
const TOAPIS_API_KEY = process.env.TOAPIS_API_KEY || "";
const DASHSCOPE_IMAGE_GENERATION_PATH = "/services/aigc/multimodal-generation/generation";
const DASHSCOPE_VIDEO_SYNTHESIS_PATH = "/services/aigc/video-generation/video-synthesis";
const VOLCENGINE_VIDEO_TASKS_PATH = "/contents/generations/tasks";

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 20 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function normalizePath(value, fallback) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const trimmed = value.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function cleanEndpointText(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+/i, "")
    .replace(/^['"`]+|['"`]+$/g, "")
    .trim();
}

function isCompleteEndpoint(value) {
  try {
    const url = new URL(value);
    return Boolean(url.pathname && url.pathname !== "/" && !/\/v\d+\/?$/i.test(url.pathname));
  } catch {
    return false;
  }
}

function pickProxyConfig(payload, fallbackPath, kind = "generic") {
  const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const { base_url, api_key, path, ...upstreamPayload } = body;
  const baseUrlInput = cleanEndpointText(base_url);
  const rawBaseUrl =
    baseUrlInput
      ? baseUrlInput.replace(/\/+$/, "")
      : TOAPIS_BASE_URL;
  const apiKey = typeof api_key === "string" && api_key.trim() ? api_key.trim() : TOAPIS_API_KEY;
  const pathText = cleanEndpointText(path);
  const isDashScopeBase = (() => {
    try {
      return new URL(rawBaseUrl).hostname.includes("dashscope.aliyuncs.com");
    } catch {
      return false;
    }
  })();
  const isVolcengineBase = (() => {
    try {
      const hostname = new URL(rawBaseUrl).hostname;
      return hostname.includes("volces.com") || hostname.includes("bytepluses.com");
    } catch {
      return false;
    }
  })();
  const isHappyHorseModel =
    typeof upstreamPayload.model === "string" &&
    upstreamPayload.model.toLowerCase().includes("happyhorse");
  const dashScopeFallbackPath =
    isDashScopeBase && kind === "video" && isHappyHorseModel
      ? DASHSCOPE_VIDEO_SYNTHESIS_PATH
      : isDashScopeBase && kind === "image"
        ? DASHSCOPE_IMAGE_GENERATION_PATH
        : isVolcengineBase && kind === "video"
          ? VOLCENGINE_VIDEO_TASKS_PATH
        : fallbackPath;
  const upstreamUrl = /^https?:\/\//i.test(pathText)
    ? pathText
    : pathText
      ? `${rawBaseUrl}${normalizePath(pathText, "")}`
      : isCompleteEndpoint(rawBaseUrl)
        ? rawBaseUrl
        : `${rawBaseUrl}${normalizePath("", dashScopeFallbackPath)}`;
  return { baseUrl: rawBaseUrl, apiKey, upstreamUrl, upstreamPayload };
}

function parseUpstreamBody(text, status) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const lower = text.toLowerCase();
    const cloudflareTimeout = status === 524 || lower.includes("error code 524") || lower.includes("a timeout occurred");
    if (cloudflareTimeout) {
      return {
        error: "上游接口处理超时，请稍后重试或改用异步任务接口。",
        code: "UPSTREAM_TIMEOUT_524",
      };
    }
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    return {
      error: titleMatch?.[1]?.trim() || "上游接口返回了非 JSON 响应。",
      code: "UPSTREAM_NON_JSON",
    };
  }
}

function withUpstreamError(data, status, upstreamUrl) {
  if (status >= 200 && status < 300) return { ...data, upstreamUrl };
  const hasMessage =
    data &&
    typeof data === "object" &&
    ("error" in data || "message" in data);
  if (hasMessage) return { ...data, upstreamUrl };
  return {
    ...data,
    error: `上游返回 ${status}，请检查接口路径。`,
    upstreamUrl,
  };
}

function buildFourViewFirstFramePrompt(payload) {
  const scenePrompt = typeof payload.scene_prompt === "string" ? payload.scene_prompt.trim() : "";
  const productType = typeof payload.product_type === "string" ? payload.product_type.trim() : "wearable inflatable product";
  const lockedNodes = Array.isArray(payload.locked_nodes) ? payload.locked_nodes : [];
  const detailImageCount = Number.isFinite(Number(payload.detail_image_count)) ? Number(payload.detail_image_count) : 0;
  const nodeLines = lockedNodes
    .filter((node) => node && typeof node === "object")
    .map((node) => {
      const code = typeof node.code === "string" ? node.code : "Locked_Detail";
      const label = typeof node.label === "string" ? node.label : "";
      const detail = typeof node.detail === "string" ? node.detail : "";
      return `- ${code}${label ? ` (${label})` : ""}: ${detail}`;
    })
    .join("\n");

  return [
    "HIGHEST PRIORITY FOUR-VIEW PRODUCT FIRST-FRAME CONTRACT.",
    "Use the four required core product views as topology maps for the same physical product: front view, left-side view, right-side view, and back view. These four core views define the product shape, proportions, surface ownership, and view-correct placement.",
    detailImageCount > 0
      ? `Optional detail supplement images are also provided (${detailImageCount}). Use them only to refine fragile local evidence such as valve mesh, face-window reflection, zipper teeth, seams, wrinkles, stitching, and material. They are auxiliary evidence, not a fifth topology surface.`
      : "No optional detail supplement image is provided. Infer fragile local details only from the four required core views and locked-node contract.",
    "Do not average the core views into a new product, do not blend them into an impossible collage, and do not redesign the product to satisfy the scene.",
    "Generate a single coherent first frame with one physically valid camera angle. The chosen camera may be front, left side, right side, or rear, but it must obey the corresponding topology instead of mixing all visible details.",
    "The scene, background, lighting, floor contact, and shadows are lower priority than product identity. If the scene conflicts with product fidelity, simplify the scene and preserve the product.",
    `Product type: ${productType}. It must remain a wearable inflatable costume/product, not a real animal, cartoon mascot, plush toy, redesigned character, or generic prop.`,
    "MANDATORY SHARK COSTUME VISUAL LOCKS:",
    "Front reference lock: preserve the white belly/front panel, horizontal transparent face window with glossy blue reflection, visible human face behind the window, vertical zipper below the window, central vertical seam, bright blue outer border, white inner arm-fin panels, blue foot covers, and inflated fabric wrinkles.",
    "Left-side reference lock: preserve the left-side silhouette and thickness, the side eye/gill/fin information visible on that side, fabric seam direction, bottom shoe/foot cover, and which structures are absent from that side.",
    "Right-side reference lock: preserve the right-side silhouette and thickness, the orange circular blower valve direction and height if visible, side fin, side vertical seam, tail-edge visibility, and black shoe sole at the bottom.",
    "Back reference lock: preserve the plain bright-blue back, central vertical back seam, top seam/stripe, centered blue rear tail fin, both side arm fins, orange valve visible on one side, black shoe soles, and wrinkled nylon inflatable fabric.",
    "Optional detail supplement lock: preserve local material, zipper, seam, wrinkle, valve, face-window, color-edge, and stitching details exactly where the core four views say they belong; never use detail images as new decorative graphics or new product surfaces.",
    "VIEW TOPOLOGY LOCK:",
    "FOUR-VIEW REFERENCES ARE TOPOLOGY MAPS, NOT COLLAGE REQUIREMENTS.",
    "PRIMARY CAMERA IS FRONT-FACING BY DEFAULT: use the front reference as the dominant product view for first-frame generation; do not switch to side or rear unless the user explicitly asks for a side or rear view.",
    "Choose one primary camera family before rendering: front, left side, right side, or rear. The generated frame must obey that camera family instead of mixing all reference views into one surface.",
    "Visibility matrix: front camera may show the front belly/window/zipper plus a thin side edge only; left-side camera may show only the structures visible on the left-side reference; right-side camera may show only the structures visible on the right-side reference, including the valve if that is the valve side; rear camera may show the rear tail fin, back seam, and plain blue back only.",
    "Do not satisfy product consistency by showing all reference details in one generated frame. Product consistency means correct physical placement and preserved shape, not maximum visible details.",
    "Do not merge details from different views into one impossible surface. The front belly/window/zipper belong only to the front-facing surface. Left-side details stay on the left side. Right-side details stay on the right side. The rear tail fin belongs on the back centerline only, never on the front belly or side waist.",
    "For a front three-quarter view, show the front belly/window/zipper and only a narrow side edge; do not attach the back tail fin to the visible side. For a left-side or right-side view, obey that side's reference exactly; the front transparent window may only appear as a thin edge, not as a large side panel. For a rear view, show the centered back tail fin and back seam; do not show the front window or gill stripes on the back.",
    "If the chosen camera angle cannot physically show a locked detail, hide it naturally instead of moving it to a wrong location.",
    "SHAPE AND VOLUME ENVELOPE LOCK:",
    "Preserve the shared four-view silhouette: medium-inflated wearable shark costume, not skinny, not overinflated, not spherical. Keep a rounded but not pointed shark head, thick soft torso, shoulder-to-body width from the references, separated padded legs, loose wrinkled foot covers, and small black shoes visible.",
    "HUMAN-SCALE SIZE LOCK: the costume must stay close to the wearer's body scale, not a giant mascot shell. The head height and body width must not grow beyond the references; keep the inflatable shell only slightly larger than the human body inside, with visible human-scale shoulders, legs, and feet.",
    "Do not enlarge the product into a tall bulky tube, oversized standing balloon, theme-park mascot, or inflated display prop. The original product is roughly body-sized, so preserve that compact wearable scale exactly.",
    "The front white belly panel must stay broad and centered, roughly 45%-55% of total body width. The body sides must gently curve inward toward the legs; do not collapse into a narrow tube and do not expand into a balloon cylinder.",
    "Wrinkle density is a fidelity marker: keep visible nylon wrinkles and seam tension. Do not smooth the fabric into plastic, rubber, plush, or a clean CGI creature.",
    "Preserve all product details even when the requested scene changes. The scene may change, but these product marks must remain visible when their side is visible.",
    "Do not remove, move, shrink, recolor, simplify, or invent any product structure. Do not make the product slimmer, taller, shorter, rounder, more muscular, more balloon-like, or more animal-like than the references. Do not add a mouth, teeth, new eyes beyond the single side eye, logo, extra accessories, claws, fur, scales, realistic shark skin, or new decorative graphics.",
    "Do not convert the costume into a clean generic blue-white shark suit. The black side eye, five black gill stripes, orange side blower valve, front transparent face window, vertical zipper, and rear tail fin are identity-critical.",
    "If the scene request conflicts with product fidelity, ignore the conflicting scene detail and keep product fidelity.",
    nodeLines ? `Confirmed locked details:\n${nodeLines}` : "Confirmed locked details: preserve every visible product structure from the uploaded references.",
    "Backend extraction priority: front view locks belly/window/zipper/front proportions; left and right side views lock side thickness, asymmetry, eye/gill/valve/fins/seams and valve direction; back view locks tail fin, back seam, rear silhouette, and rear color field; optional detail images only strengthen fragile local details.",
    `LOWER PRIORITY SCENE ONLY:\n${scenePrompt || "Keep a realistic ecommerce product-video setting."}`,
    "Composition rule: full product body visible, no crop of feet, tail, fan valve, or face window. Realistic ecommerce short-video still frame.",
  ].join("\n\n");
}

function buildFirstFramePayload(payload) {
  const {
    scene_prompt,
    product_type,
    locked_nodes,
    image_urls,
    detail_image_urls,
    prompt,
    ...upstreamPayload
  } = payload;
  const readableImages = Array.isArray(image_urls)
    ? image_urls.filter((item) => typeof item === "string" && item.trim())
    : [];
  const readableDetailImages = Array.isArray(detail_image_urls)
    ? detail_image_urls.filter((item) => typeof item === "string" && item.trim())
    : [];
  return {
    ...upstreamPayload,
    image_urls: [...readableImages, ...readableDetailImages],
    prompt: buildFourViewFirstFramePrompt({
      scene_prompt,
      product_type,
      locked_nodes,
      detail_image_count: readableDetailImages.length,
    }),
  };
}

function buildProductVideoPrompt(payload) {
  const actionPrompt = typeof payload.action_prompt === "string" ? payload.action_prompt.trim() : "";
  const scenePrompt = typeof payload.scene_prompt === "string" ? payload.scene_prompt.trim() : "";
  const productType = typeof payload.product_type === "string" ? payload.product_type.trim() : "wearable inflatable product";
  const motionRule = typeof payload.motion_rule === "string" ? payload.motion_rule.trim() : "Keep motion small and product-safe.";
  const lockedNodes = Array.isArray(payload.locked_nodes) ? payload.locked_nodes : [];
  const nodeLines = lockedNodes
    .filter((node) => node && typeof node === "object")
    .map((node) => {
      const code = typeof node.code === "string" ? node.code : "Locked_Detail";
      const label = typeof node.label === "string" ? node.label : "";
      const detail = typeof node.detail === "string" ? node.detail : "";
      return `- ${code}${label ? ` (${label})` : ""}: ${detail}`;
    })
    .join("\n");

  return [
    "HIGHEST PRIORITY PRODUCT CONSISTENCY VIDEO CONTRACT.",
    "FOUR-VIEW PRODUCT HARD LOCK. The approved first frame plus the uploaded front, left-side, right-side, and back core references are the non-negotiable source of truth for the product body. Optional detail supplements may refine fragile local details, but they never override core view topology.",
    "Animate the exact same product only. The video may change pose and scene motion, but the product itself must be locked dead across all frames: no silhouette drift, no proportion drift, no missing detail, no invented detail, no material change, and no style reinterpretation.",
    `Product type: ${productType}. It must remain the same wearable inflatable product throughout the video.`,
    "Preserve all identity-critical product details from frame 1 to the final frame. Do not redesign, simplify, restyle, recolor, or reinterpret the product.",
    "MANDATORY SHARK COSTUME VISUAL LOCKS:",
    "Keep the horizontal transparent face window, visible face behind it, vertical zipper, white belly panel, bright blue outer border, white inner fins, blue foot covers, inflated fabric wrinkles, one black side eye, exactly five black curved gill stripes, orange circular side blower valve, side seam, centered rear tail fin, back seam, and black shoe soles.",
    "VIEW TOPOLOGY LOCK:",
    "FOUR-VIEW REFERENCES ARE TOPOLOGY MAPS, NOT COLLAGE REQUIREMENTS.",
    "PRIMARY CAMERA IS FRONT-FACING BY DEFAULT: preserve the approved first-frame camera unless the user explicitly asks for a side or rear turn; do not switch to side or rear unless the user explicitly asks.",
    "Choose one primary camera family before rendering and maintain a physically valid camera path through the motion. The video may reveal or hide product surfaces as the camera/subject moves, but it must never paste details from unrelated views onto the wrong surface.",
    "Visibility matrix: front-facing frames may show the front belly/window/zipper plus a thin side edge only; left-side frames may show only structures visible on the left-side reference; right-side frames may show only structures visible on the right-side reference, including the valve if that is the valve side; rear-facing frames may show the rear tail fin, back seam, and plain blue back only.",
    "Do not satisfy product consistency by showing all reference details in one generated frame. Product consistency means correct physical placement and preserved shape, not maximum visible details.",
    "Maintain view-correct placement through the whole motion. The front belly/window/zipper stay on the front surface, left-side details stay on the left side, right-side details stay on the right side, and rear tail fin stays on the back centerline only; never move a rear tail fin to the side waist, never move the front window onto the side panel, and never combine front, side, and back details on one flat surface.",
    "When the camera rotates, reveal and hide details according to physical visibility. A detail that is not visible from the current angle must remain hidden, not relocated.",
    "SHAPE AND VOLUME ENVELOPE LOCK:",
    "Maintain the same medium-inflated four-view silhouette through every frame. The costume must not become skinny, deflated, overly tall, overly round, balloon-spherical, muscular, or creature-like.",
    "HUMAN-SCALE SIZE LOCK: the costume must stay close to the wearer's body scale, not a giant mascot shell. The head height and body width must not grow beyond the references across any frame; keep the inflatable shell only slightly larger than the human body inside.",
    "Do not let motion inflate or enlarge the product into a tall bulky tube, oversized standing balloon, theme-park mascot, or inflated display prop. The original product is roughly body-sized, so preserve that compact wearable scale exactly.",
    "Keep the reference body proportions: rounded shark head, thick soft torso, broad centered white belly panel at about 45%-55% of body width, slightly narrowing waist-to-leg transition, separated padded legs, loose wrinkled foot covers, small black shoes visible, side arm fins with white inner panels, and rear tail fin size fixed.",
    "During motion, volume may wobble slightly like nylon inflatable fabric, but body width, belly panel width, tail size, fin size, and leg thickness must remain stable. No swelling, shrinking, melting, stretching, or smoothing across frames.",
    nodeLines ? `Confirmed locked details:\n${nodeLines}` : "Confirmed locked details: preserve every visible product structure from the references.",
    `LOWER PRIORITY USER ACTION ONLY:\n${actionPrompt || "Use a simple ecommerce product display motion."}`,
    `Scene continuity:\n${scenePrompt || "Keep the approved first-frame scene."}`,
    `Motion rule:\n${motionRule}`,
    "Camera rule: stable vertical ecommerce shot, full body visible, no cuts, no fast zoom, no crop of face window, zipper, side valve, feet, fins, or tail.",
    "Negative: no mouth, no teeth, no moved fan valve, no missing face window, no broken tail, no duplicated appendages, no body deformation, no skinny body, no overinflated balloon body, no smooth plastic surface, no realistic animal skin, no new logo, no new accessories.",
    "If the user action conflicts with product fidelity, ignore the conflicting action and preserve product fidelity.",
  ].join("\n\n");
}

function buildVideoPayload(payload) {
  const {
    action_prompt,
    scene_prompt,
    product_type,
    locked_nodes,
    motion_rule,
    prompt,
    ...upstreamPayload
  } = payload;
  return {
    ...upstreamPayload,
    prompt: buildProductVideoPrompt({ action_prompt, scene_prompt, product_type, locked_nodes, motion_rule }),
  };
}

function pickReadableImages(value) {
  const images = Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
  const hasBlob = images.some((image) => image.startsWith("blob:"));
  const hasUnreadable = images.some((image) => !(/^https?:\/\//i.test(image) || image.startsWith("data:image/")));
  const readableImages = images.filter((image) => /^https?:\/\//i.test(image) || image.startsWith("data:image/"));
  return { images, readableImages, hasBlob, hasUnreadable };
}

function validateFourViewImages(payload) {
  const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  if ("foreground_source_url" in body) {
    return {
      ok: false,
      error: "四视图首帧不接受 foreground_source_url：请提交 image_urls，且必须包含正面、左侧、右侧、背面四张核心产品图。细节图请放在 detail_image_urls。",
    };
  }
  const core = pickReadableImages(body.image_urls);
  const details = pickReadableImages(body.detail_image_urls);

  if (core.hasBlob || core.hasUnreadable || core.readableImages.length !== 4) {
    return {
      ok: false,
      error: "四视图首帧 need exactly four readable core product view images：请上传正面、左侧、右侧、背面四张核心图片，提交 data:image/ 或 http(s) 图片地址；不要提交 blob: 本地预览地址。",
    };
  }

  if (details.hasBlob || details.hasUnreadable) {
    return {
      ok: false,
      error: "细节补充图 detail_image_urls 只接受 data:image/ 或 http(s) 图片地址；不要提交 blob: 本地预览地址。",
    };
  }

  return { ok: true };
}

function isDashScopeUrl(url) {
  try {
    return new URL(url).hostname.includes("dashscope.aliyuncs.com");
  } catch {
    return false;
  }
}

function isVolcengineUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.includes("volces.com") || hostname.includes("bytepluses.com");
  } catch {
    return false;
  }
}

function buildDashScopeImagePayload(payload) {
  const prompt = typeof payload.prompt === "string" ? payload.prompt : "";
  const imageUrls = Array.isArray(payload.image_urls) ? payload.image_urls.filter((item) => typeof item === "string" && item.trim()) : [];
  const content = [
    ...imageUrls.map((image) => ({ image })),
    { text: prompt },
  ];

  return {
    model: payload.model,
    input: {
      messages: [
        {
          role: "user",
          content,
        },
      ],
    },
    parameters: {
      size: "2K",
      n: 1,
      watermark: false,
      thinking_mode: true,
    },
  };
}

function normalizeVideoResolution(value) {
  return typeof value === "string" ? value.toLowerCase().replace("1080p", "1080p").replace("720p", "720p") : "1080p";
}

function buildVolcengineVideoPayload(payload) {
  const prompt = typeof payload.prompt === "string" ? payload.prompt : "";
  const imageUrl = typeof payload.image_url === "string" ? payload.image_url : "";
  const duration = Number.isFinite(Number(payload.duration)) ? Number(payload.duration) : 8;
  const ratio = typeof payload.aspect_ratio === "string" ? payload.aspect_ratio : "9:16";
  const content = [
    {
      type: "text",
      text: prompt,
    },
  ];

  if (imageUrl && imageUrl !== "PASTE_APPROVED_FIRST_FRAME_URL") {
    content.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    });
  }

  return {
    model: payload.model,
    content,
    generate_audio: Boolean(payload.audio),
    resolution: normalizeVideoResolution(payload.resolution),
    ratio,
    duration,
    seed: -1,
    watermark: false,
  };
}

function buildDashScopeVideoPayload(payload) {
  const prompt = typeof payload.prompt === "string" ? payload.prompt : "";
  const imageUrl = typeof payload.image_url === "string" ? payload.image_url : "";
  const duration = Number.isFinite(Number(payload.duration)) ? Number(payload.duration) : 8;
  const rawResolution = typeof payload.resolution === "string" ? payload.resolution : "1080P";
  const resolution = rawResolution.toUpperCase().replace("1080P", "1080P").replace("720P", "720P");
  const media =
    imageUrl && imageUrl !== "PASTE_APPROVED_FIRST_FRAME_URL"
      ? [
          {
            type: "first_frame",
            url: imageUrl,
          },
        ]
      : [];

  return {
    model: payload.model,
    input: {
      prompt,
      ...(media.length ? { media } : {}),
    },
    parameters: {
      duration,
      resolution,
      watermark: false,
    },
  };
}

function buildUpstreamPayload(kind, upstreamUrl, upstreamPayload) {
  if (isVolcengineUrl(upstreamUrl) && kind === "video") return buildVolcengineVideoPayload(upstreamPayload);
  if (!isDashScopeUrl(upstreamUrl)) return upstreamPayload;
  return kind === "video" ? buildDashScopeVideoPayload(upstreamPayload) : buildDashScopeImagePayload(upstreamPayload);
}

async function proxyJson(fallbackPath, payload, kind = "generic") {
  const { apiKey, upstreamUrl, upstreamPayload } = pickProxyConfig(payload, fallbackPath, kind);

  if (!apiKey) {
    return {
      status: 400,
      payload: {
        error: "请先填写 API Key。",
        upstreamUrl,
      },
    };
  }

  const response = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(isDashScopeUrl(upstreamUrl) && kind === "video" ? { "X-DashScope-Async": "enable" } : {}),
    },
    body: JSON.stringify(buildUpstreamPayload(kind, upstreamUrl, upstreamPayload)),
  });
  const text = await response.text();
  const data = parseUpstreamBody(text, response.status);
  return { status: response.status, payload: withUpstreamError(data, response.status, upstreamUrl) };
}

async function testProxy(fallbackPath, payload, kind = "generic") {
  const { baseUrl, apiKey, upstreamUrl: configuredUrl, upstreamPayload } = pickProxyConfig(payload, fallbackPath, kind);
  const model = typeof upstreamPayload.model === "string" ? upstreamPayload.model.trim() : "";
  if (isDashScopeUrl(configuredUrl) || (kind === "video" && isVolcengineUrl(configuredUrl))) {
    return {
      status: apiKey ? 200 : 400,
      payload: apiKey
        ? { ok: true, model, modelFound: Boolean(model), upstreamUrl: configuredUrl }
        : { error: "请先填写 API Key。", upstreamUrl: configuredUrl },
    };
  }

  const upstreamUrl = `${baseUrl}/models`;

  if (!apiKey) {
    return {
      status: 400,
      payload: {
        error: "请先填写 API Key。",
        upstreamUrl,
      },
    };
  }

  const response = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const text = await response.text();
  const data = parseUpstreamBody(text, response.status);

  if (!response.ok) {
    return {
      status: response.status,
      payload: withUpstreamError({
        ...data,
        upstreamUrl,
        upstreamStatus: response.status,
      }, response.status, upstreamUrl),
    };
  }

  const models = Array.isArray(data.data) ? data.data : [];
  const found = !model || models.some((item) => item && typeof item === "object" && item.id === model);
  if (found) {
    return {
      status: 200,
      payload: {
        ok: true,
        model,
        modelFound: Boolean(model),
        upstreamStatus: response.status,
        upstreamUrl,
      },
    };
  }

  return {
    status: 400,
    payload: {
      error: `接口已连通，但没有找到模型 ${model}。`,
      model,
      modelFound: false,
      upstreamUrl,
      upstreamStatus: response.status,
    },
  };
}

async function proxyStatus(path) {
  if (!TOAPIS_API_KEY) {
    return {
      status: 400,
      payload: {
        error: "TOAPIS_API_KEY is not configured on the backend.",
      },
    };
  }

  const response = await fetch(`${TOAPIS_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TOAPIS_API_KEY}`,
    },
  });
  const text = await response.text();
  const data = parseUpstreamBody(text, response.status);
  return { status: response.status, payload: data };
}

function buildDashScopeTaskUrl(baseUrl, taskId) {
  const parsed = new URL(baseUrl);
  const apiIndex = parsed.pathname.indexOf("/api/v1");
  const apiBasePath = apiIndex >= 0 ? parsed.pathname.slice(0, apiIndex + "/api/v1".length) : "/api/v1";
  return `${parsed.origin}${apiBasePath}/tasks/${encodeURIComponent(taskId)}`;
}

function buildVolcengineTaskUrl(baseUrl, taskId) {
  const parsed = new URL(baseUrl);
  const apiIndex = parsed.pathname.indexOf("/api/v3");
  const apiBasePath = apiIndex >= 0 ? parsed.pathname.slice(0, apiIndex + "/api/v3".length) : "/api/v3";
  return `${parsed.origin}${apiBasePath}${VOLCENGINE_VIDEO_TASKS_PATH}/${encodeURIComponent(taskId)}`;
}

async function proxyVideoStatus(payload) {
  const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const taskId = typeof body.task_id === "string" ? body.task_id.trim() : "";
  if (!taskId) {
    return { status: 400, payload: { error: "缺少视频任务号。" } };
  }

  const baseUrl = (cleanEndpointText(body.base_url) || TOAPIS_BASE_URL).replace(/\/+$/, "");
  const apiKey = typeof body.api_key === "string" && body.api_key.trim() ? body.api_key.trim() : TOAPIS_API_KEY;
  if (!apiKey) {
    return { status: 400, payload: { error: "请先填写 API Key。" } };
  }

  const statusPath = cleanEndpointText(body.status_path);
  const upstreamUrl = isDashScopeUrl(baseUrl)
    ? buildDashScopeTaskUrl(baseUrl, taskId)
    : isVolcengineUrl(baseUrl)
      ? buildVolcengineTaskUrl(baseUrl, taskId)
      : /^https?:\/\//i.test(statusPath)
        ? statusPath.replace("{task_id}", encodeURIComponent(taskId))
        : `${baseUrl}${normalizePath(statusPath || `/videos/generations/${taskId}`, "")}`;

  const response = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const text = await response.text();
  const data = parseUpstreamBody(text, response.status);
  return { status: response.status, payload: withUpstreamError(data, response.status, upstreamUrl) };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        toapisBaseUrl: TOAPIS_BASE_URL,
        hasApiKey: Boolean(TOAPIS_API_KEY),
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/first-frame") {
      const body = await readJson(req);
      const referenceCheck = validateFourViewImages(body);
      if (!referenceCheck.ok) {
        sendJson(res, 400, { error: referenceCheck.error });
        return;
      }
      const result = await proxyJson("/images/generations", buildFirstFramePayload(body), "image");
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/video") {
      const body = await readJson(req);
      const result = await proxyJson("/responses", buildVideoPayload(body), "video");
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/test-image") {
      const body = await readJson(req);
      const result = await testProxy("", body, "image");
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/test-video") {
      const body = await readJson(req);
      const result = await testProxy("", body, "video");
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/video-status") {
      const body = await readJson(req);
      const result = await proxyVideoStatus(body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/video/")) {
      const taskId = decodeURIComponent(url.pathname.replace("/api/video/", ""));
      if (!taskId) {
        sendJson(res, 400, { error: "Missing task id" });
        return;
      }
      const result = await proxyVideoStatus({ task_id: taskId });
      sendJson(res, result.status, result.payload);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

server.listen(PORT, () => {
  console.info(`API proxy listening on http://127.0.0.1:${PORT}`);
});

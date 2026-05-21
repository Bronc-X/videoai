import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const TOAPIS_BASE_URL = (process.env.TOAPIS_BASE_URL || "https://toapis.com/v1").replace(/\/+$/, "");
const TOAPIS_API_KEY = process.env.TOAPIS_API_KEY || "";

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

function pickProxyConfig(payload) {
  const body = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const { base_url, api_key, ...upstreamPayload } = body;
  const baseUrl =
    typeof base_url === "string" && base_url.trim()
      ? base_url.trim().replace(/\/+$/, "")
      : TOAPIS_BASE_URL;
  const apiKey = typeof api_key === "string" && api_key.trim() ? api_key.trim() : TOAPIS_API_KEY;
  return { baseUrl, apiKey, upstreamPayload };
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

async function proxyJson(path, payload) {
  const { baseUrl, apiKey, upstreamPayload } = pickProxyConfig(payload);

  if (!apiKey) {
    return {
      status: 400,
      payload: {
        error: "API key is missing.",
      },
    };
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(upstreamPayload),
  });
  const text = await response.text();
  const data = parseUpstreamBody(text, response.status);
  return { status: response.status, payload: data };
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
      const result = await proxyJson("/images/generations", body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/video") {
      const body = await readJson(req);
      const result = await proxyJson("/videos/generations", body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/video/")) {
      const taskId = decodeURIComponent(url.pathname.replace("/api/video/", ""));
      if (!taskId) {
        sendJson(res, 400, { error: "Missing task id" });
        return;
      }
      const result = await proxyStatus(`/videos/generations/${taskId}`);
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

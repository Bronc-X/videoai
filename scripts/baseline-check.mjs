import { readFileSync } from "node:fs";

const serverSource = readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");

const checks = [
  {
    name: "backend accepts API settings from the UI",
    pass:
      serverSource.includes("const { base_url, api_key, ...upstreamPayload } = body") &&
      serverSource.includes("typeof api_key === \"string\"") &&
      serverSource.includes("typeof base_url === \"string\""),
  },
  {
    name: "backend hides raw Cloudflare timeout HTML",
    pass:
      serverSource.includes("UPSTREAM_TIMEOUT_524") &&
      serverSource.includes("上游接口处理超时"),
  },
  {
    name: "first-frame payload sends image API settings",
    pass:
      appSource.includes("base_url: apiSettings.imageBaseUrl") &&
      appSource.includes("api_key: apiSettings.imageApiKey") &&
      appSource.includes("image_urls: uploadedUrls"),
  },
  {
    name: "video payload sends video API settings",
    pass:
      appSource.includes("base_url: apiSettings.videoBaseUrl") &&
      appSource.includes("api_key: apiSettings.videoApiKey"),
  },
  {
    name: "UI has short upstream error copy",
    pass:
      appSource.includes("上游接口处理超时，请稍后重试或改用异步任务接口。") &&
      appSource.includes("field-error"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}

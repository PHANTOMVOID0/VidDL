const fetch = require("node-fetch");
const https = require("https");

// Only use reliable Cobalt instances with valid SSL
const COBALT_INSTANCES = [
  "https://api.cobalt.tools",
  "https://cobalt.catto.re",
];

// Agent that ignores SSL errors (fallback only)
const unsafeAgent = new https.Agent({ rejectUnauthorized: false });

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url, quality = "1080", format = "mp4" } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL is required" });

  const isAudio = format === "mp3";

  const body = {
    url,
    videoQuality: quality,
    audioFormat: "mp3",
    downloadMode: isAudio ? "audio" : "auto",
    filenameStyle: "pretty",
  };

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; VidDL/1.0)",
  };

  let lastError = "";

  // Try each instance, with and without SSL enforcement
  for (const instance of COBALT_INSTANCES) {
    for (const agent of [undefined, unsafeAgent]) {
      try {
        const response = await fetch(`${instance}/`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          agent,
          timeout: 9000,
        });

        if (!response.ok) {
          lastError = `${instance} returned HTTP ${response.status}`;
          continue;
        }

        const data = await response.json();

        if (data.status === "error") {
          lastError = data.error?.code || "Cobalt returned error";
          // Don't retry same instance, break inner loop
          break;
        }

        const dlUrl =
          data.url ||
          data.tunnel ||
          (data.picker && data.picker[0]?.url);

        if (!dlUrl) {
          lastError = "No download URL in response";
          break;
        }

        const thumb =
          (data.picker && data.picker[0]?.thumb) ||
          data.thumbnail ||
          null;

        // Detect extractor from URL
        let extractor = "video";
        try {
          const u = new URL(url);
          extractor = u.hostname
            .replace("www.", "")
            .replace("m.", "")
            .split(".")[0];
        } catch (_) {}

        // Build clean title
        const title = buildTitle(url, extractor, data);

        return res.status(200).json({
          title,
          thumbnail: thumb,
          extractor,
          downloadUrl: dlUrl,
          isAudio,
          quality,
          format: isAudio ? "mp3" : "mp4",
        });

      } catch (err) {
        lastError = err.message;
        // Continue to next agent / instance
      }
    }
  }

  return res.status(500).json({
    error: "Could not reach any download server. Please try again in a moment.",
    detail: lastError,
  });
};

function buildTitle(url, extractor, data) {
  try {
    const u = new URL(url);
    // YouTube: get video ID
    if (extractor === "youtube" || extractor === "youtu") {
      const id =
        u.searchParams.get("v") ||
        u.pathname.split("/").filter(Boolean).pop();
      return `YouTube video ${id || ""}`.trim();
    }
    // TikTok
    if (extractor === "tiktok") {
      const parts = u.pathname.split("/").filter(Boolean);
      return `TikTok - ${parts[parts.length - 1] || "video"}`;
    }
    // Generic
    const path = u.pathname.replace(/\//g, " ").trim();
    return `${extractor} - ${path}`.slice(0, 80);
  } catch (_) {
    return "Video";
  }
}

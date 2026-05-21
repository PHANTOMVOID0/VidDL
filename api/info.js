const fetch = require("node-fetch");

// We use the public Cobalt API - no binary, no Python, works on Vercel
const COBALT_INSTANCES = [
  "https://api.cobalt.tools",
  "https://cobalt.catto.re",
  "https://cobalt.api.timelessnesses.me",
];

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

  let lastError = "";

  for (const instance of COBALT_INSTANCES) {
    try {
      const response = await fetch(`${instance}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
        timeout: 8000,
      });

      if (!response.ok) {
        lastError = `Instance ${instance} returned ${response.status}`;
        continue;
      }

      const data = await response.json();

      if (data.status === "error") {
        lastError = data.error?.code || "Cobalt error";
        continue;
      }

      // Get download URL from response
      const dlUrl = data.url || data.tunnel || (data.picker && data.picker[0]?.url);
      const thumb = (data.picker && data.picker[0]?.thumb) || null;

      if (!dlUrl) {
        lastError = "No download URL in response";
        continue;
      }

      // Detect the site from URL
      let extractor = "video";
      try {
        const u = new URL(url);
        const host = u.hostname.replace("www.", "").replace("m.", "");
        extractor = host.split(".")[0];
      } catch (_) {}

      return res.status(200).json({
        title: extractTitle(url, extractor),
        thumbnail: thumb,
        extractor,
        downloadUrl: dlUrl,
        isAudio,
        quality,
        format: isAudio ? "mp3" : "mp4",
        instance,
      });

    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  return res.status(500).json({
    error: "All Cobalt instances failed. Try again in a moment.",
    detail: lastError,
  });
};

function extractTitle(url, extractor) {
  try {
    const u = new URL(url);
    // Try to get video ID or path as fallback title
    const path = u.pathname.replace(/\//g, " ").trim();
    return `${extractor} video - ${path}`.slice(0, 80);
  } catch (_) {
    return "Video";
  }
}

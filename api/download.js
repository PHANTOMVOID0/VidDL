const fetch = require("node-fetch");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { downloadUrl, filename = "video", ext = "mp4" } = req.body || {};

  if (!downloadUrl) return res.status(400).json({ error: "downloadUrl is required" });

  const safeFilename = filename
    .replace(/[^a-zA-Z0-9_\-. ]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);

  try {
    const upstream = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://cobalt.tools/",
      },
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream returned ${upstream.status}` });
    }

    const contentType = upstream.headers.get("content-type") || (ext === "mp3" ? "audio/mpeg" : "video/mp4");
    const contentLength = upstream.headers.get("content-length");

    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.${ext}"`);
    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);

    upstream.body.pipe(res);

    req.on("close", () => {
      upstream.body.destroy();
    });

  } catch (err) {
    console.error("Download proxy error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Download failed", detail: err.message });
    }
  }
};

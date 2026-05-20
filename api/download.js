const ytDlp = require("yt-dlp-exec");
const { Readable } = require("stream");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url, format_id, filename, ext } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL is required" });

  const safeFilename = (filename || "video")
    .replace(/[^a-zA-Z0-9_\-. ]/g, "_")
    .slice(0, 100);

  const dlExt = ext || "mp4";

  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.${dlExt}"`);
  res.setHeader("Content-Type", dlExt === "mp3" ? "audio/mpeg" : "video/mp4");

  try {
    const args = [
      url,
      "--no-check-certificates",
      "--no-warnings",
      "-o", "-",
    ];

    if (format_id) {
      args.push("-f", format_id);
    } else if (dlExt === "mp3") {
      args.push("-f", "bestaudio", "--extract-audio", "--audio-format", "mp3");
    } else {
      args.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best");
    }

    const proc = ytDlp.raw(url, {}, { stdio: ["ignore", "pipe", "pipe"] });

    proc.stdout.pipe(res);

    proc.stderr.on("data", (data) => {
      console.error("yt-dlp stderr:", data.toString());
    });

    proc.on("error", (err) => {
      console.error("Process error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed", detail: err.message });
      }
    });

    req.on("close", () => {
      proc.kill();
    });
  } catch (err) {
    console.error("Download error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Download failed", detail: err.message });
    }
  }
};

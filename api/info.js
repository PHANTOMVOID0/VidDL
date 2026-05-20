const ytDlp = require("yt-dlp-exec");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ["referer:youtube.com", "user-agent:Mozilla/5.0"],
    });

    const formats = (info.formats || [])
      .filter((f) => f.url && f.ext !== "mhtml")
      .map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.quality,
        format_note: f.format_note || "",
        filesize: f.filesize || f.filesize_approx || null,
        vcodec: f.vcodec,
        acodec: f.acodec,
        height: f.height || null,
        fps: f.fps || null,
        url: f.url,
        http_headers: f.http_headers || {},
      }))
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    const videoFormats = formats.filter(
      (f) => f.vcodec !== "none" && f.acodec !== "none" && f.height
    );
    const audioFormats = formats.filter(
      (f) => f.vcodec === "none" && f.acodec !== "none"
    );

    res.status(200).json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      uploader: info.uploader || info.channel || "",
      view_count: info.view_count,
      extractor: info.extractor,
      videoFormats,
      audioFormats,
    });
  } catch (err) {
    console.error("yt-dlp error:", err.message);
    res.status(500).json({
      error: "Failed to fetch video info",
      detail: err.message,
    });
  }
};

let currentData = null;

const $ = (id) => document.getElementById(id);

function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }

function reset() {
  hide("results");
  hide("errorBox");
  hide("loading");
  currentData = null;
}

function switchTab(tab, btn) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  if (tab === "video") {
    show("videoFormats");
    hide("audioFormats");
  } else {
    hide("videoFormats");
    show("audioFormats");
  }
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  if (bytes > 1e3) return (bytes / 1e3).toFixed(0) + " KB";
  return bytes + " B";
}

function formatDuration(secs) {
  if (!secs) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getBadgeClass(ext) {
  if (!ext) return "badge-other";
  if (ext === "mp4") return "badge-mp4";
  if (ext === "webm") return "badge-webm";
  if (["mp3", "m4a", "opus", "aac", "flac"].includes(ext)) return "badge-audio";
  return "badge-other";
}

function buildFormatRow(f, index, isFirst) {
  const size = formatSize(f.filesize);
  const label = f.height
    ? `${f.height}p${f.fps && f.fps > 30 ? f.fps : ""} ${f.ext.toUpperCase()}`
    : (f.format_note || f.ext || "").toUpperCase();

  return `
    <div class="format-row">
      <div class="format-left">
        <span class="format-badge ${getBadgeClass(f.ext)}">${f.ext || "?"}</span>
        <span class="format-label">${label}</span>
        ${size ? `<span class="format-size">${size}</span>` : ""}
      </div>
      <div class="format-right">
        ${isFirst ? '<span class="best-badge">Best</span>' : ""}
        <button class="dl-btn" onclick="startDownload(${index}, this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
      </div>
    </div>
  `;
}

async function fetchInfo() {
  const url = $("urlInput").value.trim();
  if (!url) return;

  reset();
  show("loading");
  $("loadingText").textContent = "Fetching video info...";

  try {
    const res = await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || data.error || "Failed to fetch video info");
    }

    currentData = { ...data, originalUrl: url };
    hide("loading");
    renderResults(data);
  } catch (err) {
    hide("loading");
    $("errorMsg").textContent = err.message || "Something went wrong. Check the URL and try again.";
    show("errorBox");
  }
}

function renderResults(data) {
  $("thumbnail").src = data.thumbnail || "";
  $("videoTitle").textContent = data.title || "Untitled";
  $("videoUploader").textContent = data.uploader || "";
  $("videoDuration").textContent = formatDuration(data.duration);
  $("videoSite").textContent = (data.extractor || "").replace("_", " ").toUpperCase();
  if (!data.duration) $("videoDuration").classList.add("hidden");

  const vList = $("videoFormats");
  const aList = $("audioFormats");

  if (data.videoFormats && data.videoFormats.length > 0) {
    vList.innerHTML = data.videoFormats
      .slice(0, 10)
      .map((f, i) => buildFormatRow(f, i, i === 0))
      .join("");
  } else {
    vList.innerHTML = `<p style="color:var(--muted); padding:1rem 0; font-size:0.9rem;">No video formats found.</p>`;
  }

  if (data.audioFormats && data.audioFormats.length > 0) {
    aList.innerHTML = data.audioFormats
      .slice(0, 6)
      .map((f, i) => buildFormatRow(f, 100 + i, i === 0))
      .join("");
  } else {
    aList.innerHTML = `<p style="color:var(--muted); padding:1rem 0; font-size:0.9rem;">No audio-only formats found.</p>`;
  }

  show("results");
}

function startDownload(index, btn) {
  if (!currentData) return;

  const isAudio = index >= 100;
  const realIndex = isAudio ? index - 100 : index;
  const formats = isAudio ? currentData.audioFormats : currentData.videoFormats;
  const format = formats[realIndex];

  if (!format) return;

  btn.classList.add("downloading");
  btn.textContent = "Starting...";

  const safeTitle = (currentData.title || "video")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);

  const body = {
    url: currentData.originalUrl,
    format_id: format.format_id,
    filename: safeTitle,
    ext: format.ext,
  };

  fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Download failed");
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${safeTitle}.${format.ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      btn.classList.remove("downloading");
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
    })
    .catch((err) => {
      btn.classList.remove("downloading");
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
      alert("Download failed: " + err.message);
    });
}

$("urlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchInfo();
});

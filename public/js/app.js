let currentData = null;
let selectedQ = "1080";
let selectedF = "mp4";

const $ = (id) => document.getElementById(id);

function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }

function setQ(btn) {
  document.querySelectorAll("[data-q]").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedQ = btn.dataset.q;
}

function setF(btn) {
  document.querySelectorAll("[data-f]").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedF = btn.dataset.f;
}

function reset() {
  hide("results");
  hide("errorBox");
  hide("loading");
  currentData = null;
}

function formatDuration(secs) {
  if (!secs) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function fetchInfo() {
  const url = $("urlInput").value.trim();
  if (!url) return;

  // Basic URL validation
  try { new URL(url); } catch (_) {
    $("errorMsg").textContent = "Please enter a valid URL (must start with https://)";
    show("errorBox");
    return;
  }

  reset();
  show("loading");
  $("loadingText").textContent = "Analyzing video...";

  try {
    const res = await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, quality: selectedQ, format: selectedF }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || data.error || "Failed to fetch video info");

    currentData = data;
    hide("loading");
    renderResult(data, url);

  } catch (err) {
    hide("loading");
    $("errorMsg").textContent = err.message || "Something went wrong. Check the URL and try again.";
    show("errorBox");
  }
}

function renderResult(data, originalUrl) {
  // Thumbnail
  const thumb = $("thumbnail");
  if (data.thumbnail) {
    thumb.src = data.thumbnail;
    thumb.style.display = "block";
  } else {
    thumb.style.display = "none";
  }

  // Title - try to get clean title from URL
  let title = data.title || originalUrl;
  $("videoTitle").textContent = title;
  $("videoUploader").textContent = data.extractor ? `from ${data.extractor}` : "";
  $("videoSite").textContent = (data.extractor || "").toUpperCase();

  // Format info
  const formatLabel = data.isAudio
    ? "MP3 Audio"
    : `${data.quality}p MP4`;
  $("videoFormat").textContent = formatLabel;

  show("results");
}

function startDownload() {
  if (!currentData || !currentData.downloadUrl) return;

  const btn = $("dlBtn2");
  btn.disabled = true;
  btn.innerHTML = `<svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Preparing...`;

  const url = $("urlInput").value.trim();
  const safeTitle = (currentData.title || url)
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "video";

  fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      downloadUrl: currentData.downloadUrl,
      filename: safeTitle,
      ext: currentData.format || "mp4",
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Download failed");
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${safeTitle}.${currentData.format || "mp4"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
    })
    .catch((err) => {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
      $("errorMsg").textContent = "Download failed: " + err.message;
      show("errorBox");
    });
}

// Also offer direct link as fallback
function openDirectLink() {
  if (currentData && currentData.downloadUrl) {
    window.open(currentData.downloadUrl, "_blank");
  }
}

$("urlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchInfo();
});
